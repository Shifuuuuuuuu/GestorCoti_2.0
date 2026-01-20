/* eslint-disable no-undef */
/**
 * Import function triggers from their respective submodules:
 *
 * const {onCall} = require("firebase-functions/v2/https");
 * const {onDocumentWritten} = require("firebase-functions/v2/firestore");
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

// eslint-disable-next-line no-undef
// eslint-disable-next-line no-undef
const {onRequest} = require("firebase-functions/https");
/**
 * Cloud Functions v2 (Callable) - CommonJS
 */
const logger = require("firebase-functions/logger");
const admin = require("firebase-admin");
const { setGlobalOptions } = require("firebase-functions/v2");
const { onCall, HttpsError } = require("firebase-functions/v2/https");

// ✅ Config global (una sola vez)
setGlobalOptions({
  region: "southamerica-west1",
  timeoutSeconds: 10,
  maxInstances: 10,
});

admin.initializeApp();

/* ================== Helpers ================== */
const isEmail = (s) => typeof s === "string" && /\S+@\S+\.\S+/.test(s);

// Limpia espacios, guiones, paréntesis, etc. y valida E.164 (+ + 8-15 dígitos)
const toE164OrUndef = (p) => {
  if (!p) return undefined;
  const cleaned = String(p).trim().replace(/[^\d+]/g, ""); // deja solo + y dígitos
  return /^\+\d{8,15}$/.test(cleaned) ? cleaned : undefined;
};

const mapAdminAuthErrorToHttps = (err) => {
  const code = err?.code || "";

  if (code === "auth/email-already-exists")
    throw new HttpsError("already-exists", "EMAIL_IN_USE");
  if (code === "auth/invalid-email")
    throw new HttpsError("invalid-argument", "INVALID_EMAIL");
  if (code === "auth/invalid-password")
    throw new HttpsError("invalid-argument", "TOO_SHORT");
  if (code === "auth/invalid-phone-number")
    throw new HttpsError("invalid-argument", "INVALID_PHONE");
  if (code === "auth/user-not-found")
    throw new HttpsError("not-found", "USER_NOT_FOUND");

  // 👇 IMPORTANTÍSIMO: si es interno, mandamos detalles reales
  throw new HttpsError("internal", "INTERNAL_ERROR", {
    adminCode: code,
    adminMessage: err?.message || String(err),
  });
};

/* ================== Ping ================== */
exports.ping = onCall(async () => ({ ok: true, ts: Date.now() }));

/* ================== Crear usuario (Auth) ================== */
exports.adminCreateUser = onCall(async (request) => {
  try {
    const data = request.data || {};

    const email = (data.email || "").trim();
    const password = String(data.password || "");
    const displayName = (data.displayName || "").trim();

    const phoneRaw = (data.phone || "").trim();
    const phoneE164 = toE164OrUndef(phoneRaw);

    // Validaciones (estas DEVUELVEN invalid-argument, NO 500)
    if (!isEmail(email)) throw new HttpsError("invalid-argument", "INVALID_EMAIL");
    if (!password || password.length < 6) throw new HttpsError("invalid-argument", "TOO_SHORT");
    if (!displayName) throw new HttpsError("invalid-argument", "MISSING_NAME");

    // Si escribió teléfono pero es inválido => error claro
    if (phoneRaw && !phoneE164) throw new HttpsError("invalid-argument", "INVALID_PHONE");

    logger.info("adminCreateUser payload", {
      email,
      displayName,
      phoneRaw,
      phoneE164,
      passLen: password.length,
    });

    const userRecord = await admin.auth().createUser({
      email,
      password,
      displayName,
      phoneNumber: phoneE164, // ✅ válido o undefined
      disabled: false,
    });

    return { uid: userRecord.uid };
  } catch (err) {
    logger.error("adminCreateUser error:", err);
    if (err instanceof HttpsError) throw err;
    mapAdminAuthErrorToHttps(err);
  }
});

/* ================== Actualizar usuario (Auth) ================== */
exports.adminUpdateUser = onCall(async (request) => {
  try {
    const data = request.data || {};
    const uid = data.uid;

    if (!uid) throw new HttpsError("invalid-argument", "MISSING_UID");

    const patch = {};

    if (typeof data.email === "string") {
      const email = data.email.trim();
      if (email && !isEmail(email)) throw new HttpsError("invalid-argument", "INVALID_EMAIL");
      patch.email = email;
    }

    if (typeof data.displayName === "string") {
      const dn = data.displayName.trim();
      if (!dn) throw new HttpsError("invalid-argument", "MISSING_NAME");
      patch.displayName = dn;
    }

    if (typeof data.phone === "string") {
      const phoneRaw = data.phone.trim();
      const phoneE164 = toE164OrUndef(phoneRaw);

      if (phoneRaw && !phoneE164) throw new HttpsError("invalid-argument", "INVALID_PHONE");

      // vacío => undefined (borra teléfono)
      patch.phoneNumber = phoneE164;
    }

    logger.info("adminUpdateUser patch", { uid, patch });

    const userRecord = await admin.auth().updateUser(String(uid), patch);
    return { uid: userRecord.uid };
  } catch (err) {
    logger.error("adminUpdateUser error:", err);
    if (err instanceof HttpsError) throw err;
    mapAdminAuthErrorToHttps(err);
  }
});

/* ================== Eliminar usuario (Auth) ================== */
exports.adminDeleteUser = onCall(async (request) => {
  try {
    const data = request.data || {};
    const uid = data.uid;

    if (!uid) throw new HttpsError("invalid-argument", "MISSING_UID");

    await admin.auth().deleteUser(String(uid));
    return { ok: true };
  } catch (err) {
    logger.error("adminDeleteUser error:", err);
    if (err instanceof HttpsError) throw err;
    mapAdminAuthErrorToHttps(err);
  }
});


// For cost control, you can set the maximum number of containers that can be
// running at the same time. This helps mitigate the impact of unexpected
// traffic spikes by instead downgrading performance. This limit is a
// per-function limit. You can override the limit for each function using the
// `maxInstances` option in the function's options, e.g.
// `onRequest({ maxInstances: 5 }, (req, res) => { ... })`.
// NOTE: setGlobalOptions does not apply to functions using the v1 API. V1
// functions should each use functions.runWith({ maxInstances: 10 }) instead.
// In the v1 API, each function can only serve one request per container, so
// this will be the maximum concurrent request count.
setGlobalOptions({ maxInstances: 10 });

// Create and deploy your first functions
// https://firebase.google.com/docs/functions/get-started

// exports.helloWorld = onRequest((request, response) => {
//   logger.info("Hello logs!", {structuredData: true});
//   response.send("Hello from Firebase!");
// });
