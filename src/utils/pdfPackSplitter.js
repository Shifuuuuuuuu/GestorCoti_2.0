import { PDFDocument } from "pdf-lib";
import { getDocument, GlobalWorkerOptions } from "pdfjs-dist/legacy/build/pdf";
import pdfWorker from "pdfjs-dist/legacy/build/pdf.worker?url";
GlobalWorkerOptions.workerSrc = pdfWorker;

function normText(s) {
  return (s || "")
    .toString()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[‐-–—]/g, "-")
    .replace(/[\u00BA\u00B0]/g, "o")
    .toLowerCase()
    .replace(/[^\x00-\x7F]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function compactPunct(t) {
  return (t || "")
    .replace(/\s*([.#:\/\-])\s*/g, "$1")
    .replace(/\s*([#])\s*/g, "$1");
}

function keyText(s) {
  return normText(s).replace(/[^a-z0-9]+/g, "");
}

function normForParse(text) {
  let t = normText(text);

  t = t
    .replace(/\bn\s*(?:o|º|°)\b/g, "no")
    .replace(/\bnro\.?\b/g, "no")
    .replace(/\bnum\.?\b/g, "numero");


  t = t
    .replace(/\b[o0]\s*[.]\s*c\b/g, "oc")
    .replace(/\b[o0]\s*[/\\-]\s*c\b/g, "oc")
    .replace(/\b[o0]\s+c\b/g, "oc");


  t = t.replace(/\bordendecompr[ae]\b/g, "orden de compra");


  t = t.replace(/\bpo\s*number\b/g, "po number").replace(/\bp\.o\b/g, "po");

  t = compactPunct(t);
  return t;
}


const OC_MIN = 3;
const OC_MAX = 10;

function pickNumber(raw, { min, max }) {
  const s = (raw || "").toString();

  const tokens = s.match(/\d+/g) || [];
  const inRange = tokens
    .filter((x) => x.length >= min && x.length <= max)
    .sort((a, b) => b.length - a.length);
  if (inRange.length) return inRange[0];

  const singles = s.match(/\d/g) || [];
  if (singles.length >= min) {
    const joined = singles.slice(0, max).join("");
    if (joined.length >= min && joined.length <= max) return joined;
  }
  return "";
}

const OC_FLEX = "(\\d(?:[\\s\\.]*\\d){2,9})";


const NUM = "(?:no\\.?|nro\\.?|numero|num\\.?|n\\.?o\\.?|no)";
const SEP = "(?:\\s*(?::|#|-)?\\s*)";
const MID = `${SEP}(?:${NUM}${SEP})?${SEP}`;


function rutClean(raw) {
  const s = (raw || "").toString().toUpperCase();
  const only = s.replace(/[^0-9K]/g, "");
  if (only.length < 2) return "";
  const body = only.slice(0, -1);
  const dv = only.slice(-1);
  return `${body}-${dv}`;
}

function rutDv(bodyDigits) {
  let sum = 0;
  let mul = 2;
  for (let i = bodyDigits.length - 1; i >= 0; i--) {
    sum += parseInt(bodyDigits[i], 10) * mul;
    mul = mul === 7 ? 2 : mul + 1;
  }
  const r = 11 - (sum % 11);
  if (r === 11) return "0";
  if (r === 10) return "K";
  return String(r);
}

function rutIsValid(rut) {
  const cleaned = rutClean(rut);
  if (!cleaned) return false;
  const [body, dv] = cleaned.split("-");
  if (!body || !dv) return false;
  if (!/^\d+$/.test(body)) return false;
  return rutDv(body) === dv;
}

function extractRutHints(text) {
  const t = normForParse(text);
  const candidates = [];

  for (const m of t.matchAll(
    /(?:r\s*\.?\s*u\s*\.?\s*t\s*\.?\s*|rut)\s*[:#-]?\s*(\d{1,2}[\.\s]?\d{3}[\.\s]?\d{3}\s*-\s*[\dk])/gi
  )) candidates.push(m[1]);

  for (const m of t.matchAll(/(\d{1,2}[\.\s]?\d{3}[\.\s]?\d{3}\s*-\s*[\dk])/gi)) candidates.push(m[1]);
  for (const m of t.matchAll(/(\d{7,8}\s*-\s*[\dk])/gi)) candidates.push(m[1]);
  for (const m of t.matchAll(/(\d{7,8})\s+([\dk])\b/gi)) candidates.push(`${m[1]}-${m[2]}`);

  const merged = candidates.map(rutClean).filter(Boolean);

  const valids = [];
  for (const r of merged) {
    if (rutIsValid(r) && !valids.includes(r)) valids.push(r);
    if (valids.length >= 10) break;
  }
  return valids;
}


function extractDteTipo(text) {
  const t = normForParse(text);
  const k = keyText(text);

  let m =
    t.match(/\btipo\s*documento\b\s*[:#-]?\s*(\d{2,4})\b/i) ||
    t.match(/\btipo\s*de\s*documento\b\s*[:#-]?\s*(\d{2,4})\b/i);

  if (m?.[1]) return parseInt(m[1], 10);

  m = k.match(/tipodocumento(\d{2,4})/i);
  if (m?.[1]) return parseInt(m[1], 10);

  return null;
}


function isFacturaLikeText(tRaw) {
  const t = normForParse(tRaw);
  const k = keyText(tRaw);
  const dte = extractDteTipo(tRaw);

  if (dte === 33 || dte === 34) return true;

  const hasFacturaElectronica =
    /factura\s*electron/i.test(t) ||
    /factura\s*electr/i.test(t) ||
    k.includes("facturaelectron");

  const hasFacturaExentaAfecta =
    /factura\s*(?:exenta|afecta)/i.test(t) ||
    k.includes("facturaexenta") ||
    k.includes("facturaafecta");

  const hasSiiSignals =
    /servicio\s*de\s*impuestos\s*internos/i.test(t) ||
    /\bs\.?i\.?i\.?\b/i.test(t) ||
    /timbre\s*electron/i.test(t);

  const hasFacturaWords =
    /\bcedible\b/i.test(t) ||
    /\breceptor\b/i.test(t) ||
    /\bemisor\b/i.test(t) ||
    /\bgiro\b/i.test(t) ||
    /\biva\b/i.test(t) ||
    /\bneto\b/i.test(t) ||
    /\btotal\b/i.test(t);

  if (hasFacturaElectronica) return true;
  if (hasFacturaExentaAfecta) return true;
  if (hasSiiSignals && hasFacturaWords) return true;

  return false;
}


function extractOcCandidates(headerTextRaw, bodyTextRaw) {
  const header = headerTextRaw || "";
  const body = bodyTextRaw || "";
  const tRaw = `${header}\n${body}`.trim();

  if (isFacturaLikeText(tRaw)) return [];

  const t = normForParse(tRaw);
  const tNoSpaces = t.replace(/\s+/g, "");

  const list = [];
  const push = (raw, score, source) => {
    const value = pickNumber(raw, { min: OC_MIN, max: OC_MAX });
    if (!value) return;
    list.push({ value, score, source });
  };

  const patterns = [
    { score: 120, source: "orden_compra", rx: new RegExp(`orden\\s*(?:de\\s*)?compr[ae]\\b${MID}${OC_FLEX}`, "ig") },
    { score: 118, source: "orden_compra_short", rx: new RegExp(`orden\\s*compr[ae]\\b${MID}${OC_FLEX}`, "ig") },
    { score: 110, source: "oc_tag", rx: new RegExp(`\\boc\\b${MID}${OC_FLEX}`, "ig") },
    { score: 108, source: "oc_hash", rx: new RegExp(`\\boc\\b\\s*#\\s*${OC_FLEX}`, "ig") },
    { score: 104, source: "po_number", rx: new RegExp(`\\bpo\\b\\s*(?:number|no)?${SEP}${OC_FLEX}`, "ig") },
    { score: 102, source: "purchase_order", rx: new RegExp(`purchase\\s*order\\s*(?:number|no)?${SEP}${OC_FLEX}`, "ig") },
    { score: 112, source: "dte801_folio", rx: new RegExp(`tipo\\s*documento\\s*[:#-]?\\s*801.*?folio\\s*[:#-]?\\s*${OC_FLEX}`, "ig") },
    { score: 90, source: "folio_generic", rx: new RegExp(`\\bfolio\\b\\s*[:#-]?\\s*${OC_FLEX}`, "ig") },
  ];


  const headerNorm = normForParse(header);
  for (const p of patterns) {
    for (const m of headerNorm.matchAll(p.rx)) {
      if (m?.[1]) push(m[1], p.score + 10, `header:${p.source}`);
    }
  }


  for (const p of patterns) {
    for (const m of t.matchAll(p.rx)) {
      if (m?.[1]) push(m[1], p.score, p.source);
    }
  }


  const m2 = tNoSpaces.match(/ordendecompr[ae](?:no|nro|numero|num)?[:#-]?(\d{3,10})/i);
  if (m2?.[1]) push(m2[1], 80, "nospace_ordencompra");


  const best = new Map();
  for (const c of list) {
    const prev = best.get(c.value);
    if (!prev || c.score > prev.score) best.set(c.value, c);
  }

  return Array.from(best.values()).sort((a, b) => b.score - a.score).slice(0, 8);
}

function extractRefOcInFacturaCandidates(headerTextRaw, bodyTextRaw) {
  const header = headerTextRaw || "";
  const body = bodyTextRaw || "";
  const tRaw = `${header}\n${body}`.trim();

  const dte = extractDteTipo(tRaw);
  const facturaLike = isFacturaLikeText(tRaw);
  const guiaLike = dte === 52;

  if (!facturaLike && !guiaLike) return [];

  const t = normForParse(tRaw);

  const list = [];
  const push = (raw, score, source) => {
    const value = pickNumber(raw, { min: OC_MIN, max: OC_MAX });
    if (!value) return;
    list.push({ value, score, source });
  };

  const patterns = [
    { score: 130, source: "ref_orden_compra", rx: new RegExp(`orden\\s*(?:de\\s*)?compr[ae]\\b${MID}${OC_FLEX}`, "ig") },
    { score: 126, source: "ref_orden_compra_short", rx: new RegExp(`orden\\s*compr[ae]\\b${MID}${OC_FLEX}`, "ig") },

    { score: 122, source: "ref_oc_tag", rx: new RegExp(`\\boc\\b${MID}${OC_FLEX}`, "ig") },
    { score: 118, source: "ref_po_number", rx: new RegExp(`\\bpo\\b\\s*(?:number|no)?${SEP}${OC_FLEX}`, "ig") },

    { score: 124, source: "doc_referencia_orden", rx: new RegExp(`doc\\.?\\s*referenc(?:ia|ias)[\\s\\S]{0,120}?orden\\s*(?:de\\s*)?compr[ae]\\b${MID}${OC_FLEX}`, "ig") },
  ];

  const headerNorm = normForParse(header);
  for (const p of patterns) {
    for (const m of headerNorm.matchAll(p.rx)) {
      if (m?.[1]) push(m[1], p.score + 8, `header:${p.source}`);
    }
  }


  for (const p of patterns) {
    for (const m of t.matchAll(p.rx)) {
      if (m?.[1]) push(m[1], p.score, p.source);
    }
  }


  const best = new Map();
  for (const c of list) {
    const prev = best.get(c.value);
    if (!prev || c.score > prev.score) best.set(c.value, c);
  }

  return Array.from(best.values()).sort((a, b) => b.score - a.score).slice(0, 8);
}

function isOcLikeText(tRaw) {
  if (isFacturaLikeText(tRaw)) return false;

  const t = normForParse(tRaw);
  const k = keyText(tRaw);
  const dte = extractDteTipo(tRaw);

  if (dte === 801) return true;

  const hasOrdenCompra =
    /orden\s*(?:de\s*)?compr[ae]\b/i.test(t) ||
    k.includes("ordendecompra") ||
    k.includes("ordendecompre");

  const hasParenOc = /[\(\[\{]\s*oc\s*[\)\]\}]/i.test(t);
  const hasPurchase =
    /purchase\s*order/i.test(t) || /po\s*number/i.test(t) || /\bpo\b/i.test(t);

  const hasOcWithNumber = new RegExp(`\\boc\\b${MID}${OC_FLEX}`, "i").test(t);

  return hasOrdenCompra || hasParenOc || hasPurchase || hasOcWithNumber;
}

function classifyDocType(headerTextRaw, bodyTextRaw) {
  const tRaw = `${headerTextRaw || ""}\n${bodyTextRaw || ""}`.trim();
  const dteTipo = extractDteTipo(tRaw);

  if (dteTipo === 52) return { tipo: "guia", confidence: 0.98, dteTipo };

  if (isFacturaLikeText(tRaw)) return { tipo: "factura", confidence: 0.95, dteTipo };


  if (isOcLikeText(tRaw)) return { tipo: "oc", confidence: 0.9, dteTipo };

  return { tipo: "factura", confidence: 0.4, dteTipo };
}

function buildLinesFromItems(items) {
  const pts = (items || [])
    .filter((it) => it && typeof it.str === "string" && it.str.trim() !== "")
    .map((it) => ({
      str: it.str,
      x: it.transform ? it.transform[4] : 0,
      y: it.transform ? it.transform[5] : 0,
    }));

  pts.sort((a, b) => b.y - a.y || a.x - b.x);

  const lines = [];
  const Y_TOL = 2.6;

  for (const p of pts) {
    const last = lines[lines.length - 1];
    if (!last || Math.abs(p.y - last.y) > Y_TOL) {
      lines.push({ y: p.y, chunks: [p] });
    } else {
      last.chunks.push(p);
    }
  }

  const lineTexts = lines
    .map((l) => {
      l.chunks.sort((a, b) => a.x - b.x);
      return l.chunks.map((c) => c.str).join(" ").replace(/\s+/g, " ").trim();
    })
    .filter(Boolean);

  const maxY = pts.length ? Math.max(...pts.map((p) => p.y)) : 0;
  return { lineTexts, lines, maxY };
}

async function getPageText(pdfjsDoc, pageNo) {
  const page = await pdfjsDoc.getPage(pageNo);
  const viewport = page.getViewport({ scale: 1 });

  const content = await page.getTextContent();
  const items = content.items || [];

  const { lineTexts, lines, maxY } = buildLinesFromItems(items);

  const fullText = lineTexts.join("\n");

  const threshold = maxY * 0.75;
  const topLineTexts = lines
    .filter((l) => l.y >= threshold)
    .map((l) => {
      l.chunks.sort((a, b) => a.x - b.x);
      return l.chunks.map((c) => c.str).join(" ").replace(/\s+/g, " ").trim();
    })
    .filter(Boolean);

  const topText = topLineTexts.join("\n");
  return { fullText, topText, pageHeight: viewport.height };
}

function computeCoherence(tipo, numero, refOc, ruts, pageTexts, ocCandidates = []) {
  const reasons = [];
  const allRaw = pageTexts.join(" ");
  const all = normForParse(allRaw);

  if (tipo === "oc" && !String(numero || "").trim()) {
    reasons.push("OC sin número detectado (completar manual).");
    if (ocCandidates?.length) reasons.push(`Sugerencias: ${ocCandidates.map((c) => c.value).join(", ")}`);
  }

  if ((tipo === "factura" || tipo === "guia")) {
    const mentionsOc = /orden\s*(?:de\s*)?compr[ae]\b|\boc\b|\bpo\b/i.test(all);
    if (mentionsOc && !String(refOc || "").trim()) {
      reasons.push("Menciona OC pero no se pudo extraer el número (ingresar/seleccionar manual).");
    }
  }

  if (all.replace(/\s+/g, "").length < 30) {
    reasons.push("Texto muy corto o PDF escaneado (OCR no disponible).");
  }
  if (!ruts || ruts.length === 0) {
    reasons.push("No se detectó RUT (si falla, permite ingresarlo manualmente).");
  }

  return { ok: reasons.length === 0, reasons };
}


export async function splitPdfPack(file) {
  const parentName = file?.name || "paquete.pdf";

  const bufOriginal = await file.arrayBuffer();
  const bufForPdfJs = bufOriginal.slice(0);
  const bufForPdfLib = bufOriginal.slice(0);

  const pdfjsTask = getDocument({
    data: new Uint8Array(bufForPdfJs),
    disableFontFace: true,
    useSystemFonts: true,
  });

  const pdfjs = await pdfjsTask.promise;
  const numPages = pdfjs.numPages;

  const pagesMeta = [];

  for (let p = 1; p <= numPages; p++) {
    try {
      const { fullText, topText } = await getPageText(pdfjs, p);

      const cls = classifyDocType(topText, fullText);
      const tipo = cls.tipo;

      const combinedRaw = `${topText || ""}\n${fullText || ""}`.trim();
      const ruts = extractRutHints(combinedRaw);

      let ocCandidates = [];
      let refOc = "";
      let numero = "";

      if (tipo === "oc") {
        ocCandidates = extractOcCandidates(topText, fullText);
        numero = ocCandidates?.[0]?.value || "";
        refOc = numero;
      } else {
        ocCandidates = extractRefOcInFacturaCandidates(topText, fullText);
        refOc = ocCandidates?.[0]?.value || "";
        numero = "";
      }

      const coherence = computeCoherence(tipo, numero, refOc, ruts, [fullText || ""], ocCandidates);

      pagesMeta.push({
        pageNo: p,
        text: fullText || "",
        headerText: topText || "",
        tipo,
        tipoConfidence: cls.confidence,
        dteTipo: cls.dteTipo,
        numero,
        refOc,
        ocCandidates,
        ruts,
        coherence,
      });
    } catch (e) {
      pagesMeta.push({
        pageNo: p,
        text: "",
        headerText: "",
        tipo: "factura",
        tipoConfidence: 0.1,
        dteTipo: null,
        numero: "",
        refOc: "",
        ocCandidates: [],
        ruts: [],
        coherence: { ok: false, reasons: ["Error leyendo página (PDF corrupto o escaneado)."] },
      });
    }
  }

  const srcPdf = await PDFDocument.load(bufForPdfLib);

  const parts = [];
  const totalParts = pagesMeta.length;

  for (let i = 0; i < pagesMeta.length; i++) {
    const m = pagesMeta[i];
    const partIndex = i + 1;

    const outPdf = await PDFDocument.create();
    const pageNo0 = m.pageNo - 1;

    const [copiedPage] = await outPdf.copyPages(srcPdf, [pageNo0]);
    outPdf.addPage(copiedPage);

    const blobBytes = await outPdf.save();
    const blob = new Blob([blobBytes], { type: "application/pdf" });

    parts.push({
      tipo: m.tipo,
      numero: String(m.numero || "").trim(),
      refOc: String(m.refOc || "").trim(),
      ocCandidates: (m.ocCandidates || []).slice(0, 8),
      ruts: (m.ruts || []).slice(0, 10),
      pagesCount: 1,
      pageRange: `${m.pageNo}-${m.pageNo}`,
      coherence: m.coherence,
      parentName,
      partIndex,
      totalParts,
      tipoConfidence: m.tipoConfidence,
      dteTipo: m.dteTipo,
      blob,
    });
  }

  try { await pdfjs.destroy(); } catch (e) { console.log(e); }

  return { docs: parts };
}
