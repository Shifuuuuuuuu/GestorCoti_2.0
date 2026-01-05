// src/services/aiInspector.js
import { geminiModel } from "@/stores/firebase";

/** Mantengo el export para tu UI, pero ahora no es necesario */
export function resetAiChat() {
  // Stateless: no hay chat persistente
}

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onerror = reject;
    r.onload = () => resolve(String(r.result).split(",")[1]);
    r.readAsDataURL(file);
  });
}

function tryParseJSON(text) {
  try {
    const t = String(text || "").trim();
    if (!t) return null;
    const cleaned = t
      .replace(/^```json/i, "")
      .replace(/^```/i, "")
      .replace(/```$/i, "")
      .trim();
    return JSON.parse(cleaned);
  } catch {
    return null;
  }
}

function detectFocus(question) {
  const q = String(question || "").toLowerCase();

  if (q.includes("epp") || q.includes("señal") || q.includes("senal")) return "EPP";
  if (q.includes("riesg")) return "RIESGOS";
  if (q.includes("checklist")) return "CHECKLIST";
  if (q.includes("resume") || q.includes("observado") || q.includes("falta /")) return "RESUMEN";
  if (q.includes("estandar") || q.includes("estándar") || q.includes("faltan")) return "ESTANDARES";

  return "GENERAL";
}

async function forceToJson(rawText) {
  const fixPrompt = `
Convierte la RESPUESTA a un JSON ESTRICTO y nada más.
- NO uses markdown
- NO agregues texto extra
- Si no sabes algo, usa null o [].
- Respeta EXACTAMENTE el esquema.

Esquema:
{
  "pregunta_respondida": string,
  "focus": "ESTANDARES"|"RIESGOS"|"EPP"|"CHECKLIST"|"RESUMEN"|"GENERAL",
  "respuesta": string,
  "tipo_equipo": string|null,
  "confianza_tipo": number|null,
  "hallazgos": [{"titulo": string, "detalle": string, "riesgo": "ALTO"|"MEDIO"|"BAJO"|null, "accion": string|null, "evidencia": string|null}],
  "faltantes_estandares": [{"item": string, "riesgo": "ALTO"|"MEDIO"|"BAJO"|null, "por_que": string|null, "accion": string|null}],
  "riesgos_criticos": [{"titulo": string, "riesgo": "ALTO"|"MEDIO"|"BAJO"|null, "detalle": string|null, "accion": string|null}],
  "acciones_recomendadas": [string],
  "documentos_detectados": [{"tipo": string, "fecha": string|null, "esta_vencido": boolean|null, "nota": string|null}],
  "fotos_recomendadas": [string],
  "resumen": {"observado":[string], "falta":[string], "riesgo":[string], "accion":[string]}
}

RESPUESTA A CONVERTIR:
${rawText}
`.trim();

  const fix = await geminiModel.generateContent(fixPrompt);
  return fix.response.text();
}

export async function askInspectorAI({ question, files = [], extraNotes = "", equipo = null }) {
  const focus = detectFocus(question);

  const equipoBlock = equipo
    ? `
DATOS DEL EQUIPO (seleccionado):
- Patente/Código: ${equipo.codigo || "N/D"}
- Tipo: ${equipo.tipo_equipo || equipo.clasificacion1 || "N/D"}
- Nombre: ${equipo.equipo || "N/D"}
- Marca/Modelo: ${equipo.marca || "N/D"} / ${equipo.modelo || "N/D"}
- Año: ${equipo.ano ?? "N/D"}
- Chasis: ${equipo.numero_chasis || "N/D"}
- Localización: ${equipo.localizacion || "N/D"}
`
    : "DATOS DEL EQUIPO: (no seleccionado)\n";

  const system = `
Actúa en el ROL de:
- Inspector de seguridad minera (estilo faena / estándares mineros) y
- Mecánico integral (eléctrico + maquinaria pesada + flota liviana).
IMPORTANTE: No inventes ni “adivines”. Si no se ve, dilo y pide foto.

Reglas duras:
1) Responde SOLO la PREGUNTA actual. No respondas otras preguntas.
2) Completa SOLO secciones relevantes al FOCUS indicado. Las demás: [] o null.
   - FOCUS ESTANDARES: usa faltantes_estandares + fotos_recomendadas + respuesta
   - FOCUS RIESGOS: usa riesgos_criticos + acciones_recomendadas + respuesta
   - FOCUS EPP: usa faltantes_estandares (EPP/señalética) + respuesta
   - FOCUS CHECKLIST: usa acciones_recomendadas (como checklist) + respuesta
   - FOCUS RESUMEN: usa resumen + respuesta
   - FOCUS GENERAL: puedes usar varias secciones si aplica.
3) Devuelve SOLO JSON ESTRICTO (sin markdown, sin texto extra).
4) Si detectas documentos/fechas, extrae lo que puedas; si no es legible, indica null y sugiere foto mejor.
`.trim();

  const prompt = `
${system}

FOCUS: ${focus}

${equipoBlock}

PREGUNTA (RESPONDER SOLO ESTA):
${question}

NOTAS:
${extraNotes || "(sin notas)"}

Esquema JSON (obligatorio):
{
  "pregunta_respondida": string,
  "focus": "ESTANDARES"|"RIESGOS"|"EPP"|"CHECKLIST"|"RESUMEN"|"GENERAL",
  "respuesta": string,
  "tipo_equipo": string|null,
  "confianza_tipo": number|null,
  "hallazgos": [{"titulo": string, "detalle": string, "riesgo": "ALTO"|"MEDIO"|"BAJO"|null, "accion": string|null, "evidencia": string|null}],
  "faltantes_estandares": [{"item": string, "riesgo": "ALTO"|"MEDIO"|"BAJO"|null, "por_que": string|null, "accion": string|null}],
  "riesgos_criticos": [{"titulo": string, "riesgo": "ALTO"|"MEDIO"|"BAJO"|null, "detalle": string|null, "accion": string|null}],
  "acciones_recomendadas": [string],
  "documentos_detectados": [{"tipo": string, "fecha": string|null, "esta_vencido": boolean|null, "nota": string|null}],
  "fotos_recomendadas": [string],
  "resumen": {"observado":[string], "falta":[string], "riesgo":[string], "accion":[string]}
}
`.trim();

  const parts = [prompt];

  for (const f of files) {
    const b64 = await fileToBase64(f);
    parts.push({ inlineData: { data: b64, mimeType: f.type } });
  }

  // ✅ Stateless: no chat, no mezcla preguntas anteriores
  const result = await geminiModel.generateContent(parts);
  let text = result.response.text();

  if (!tryParseJSON(text)) {
    const forced = await forceToJson(text);
    if (tryParseJSON(forced)) text = forced;
  }

  return text;
}
