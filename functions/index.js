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
// eslint-disable-next-line no-undef
const logger = require("firebase-functions/logger");
// functions/index.js
// eslint-disable-next-line no-undef
const admin = require("firebase-admin");
// eslint-disable-next-line no-undef
const { setGlobalOptions } = require("firebase-functions/v2");           // v2
// eslint-disable-next-line no-undef
const { onCall, HttpsError } = require("firebase-functions/v2/https");   // v2

// Usa tu región (recomendado: la misma que tu proyecto/Firestore)
// Ej: "southamerica-west1" (Chile/Latam) o "us-central1" si prefieres default
setGlobalOptions({
  region: "southamerica-west1",
  timeoutSeconds: 20,
  // opcional: memoryMiB: 256,
  // opcional: maxInstances: 10,
});

admin.initializeApp();

// (opcional) helper simple para validar E.164 (+56...) o no enviar phoneNumber
const asE164 = (p) => (typeof p === "string" && /^\+\d{8,15}$/.test(p) ? p : undefined);
function isEmail(s) {
  return typeof s === "string" && /\S+@\S+\.\S+/.test(s);
}

// --- Ping de prueba ---
// eslint-disable-next-line no-undef
exports.ping = onCall(async () => ({ ok: true, ts: Date.now() }));

// --- Crear usuario en Authentication ---
// eslint-disable-next-line no-undef
exports.adminCreateUser = onCall(async (request) => {
  try {
    const data = request.data || {};
    const email = (data.email || "").trim();
    const password = (data.password || "");
    const displayName = (data.displayName || "").trim();
    const phone = (data.phone || "").trim();

    // Validaciones
    if (!isEmail(email)) {
      throw new HttpsError("invalid-argument", "INVALID_EMAIL");
    }
    if (!password || password.length < 6) {
      throw new HttpsError("invalid-argument", "TOO_SHORT"); // 👈 de aquí viene tu mensaje
    }
    if (!displayName) {
      throw new HttpsError("invalid-argument", "MISSING_NAME");
    }

    // (Opcional) restringir quién puede invocar (recomendado):
    // if (!request.auth || request.auth.token.role !== 'Admin') {
    //   throw new HttpsError("permission-denied", "FORBIDDEN");
    // }

    // Crear en Auth
    const userRecord = await admin.auth().createUser({
      email,
      password,
      displayName,
      phoneNumber: phone || undefined,
      disabled: false,
    });

    // (Opcional) set custom claims
    // await admin.auth().setCustomUserClaims(userRecord.uid, { role: 'Editor' });

    return { uid: userRecord.uid };
  } catch (err) {
    logger.error("adminCreateUser error:", err);
    if (err instanceof HttpsError) throw err;

    // Mapear algunos errores comunes de Auth
    const code = err?.code || "";
    if (code === "auth/email-already-exists") {
      throw new HttpsError("already-exists", "EMAIL_IN_USE");
    }
    if (code === "auth/invalid-phone-number") {
      throw new HttpsError("invalid-argument", "INVALID_PHONE");
    }
    throw new HttpsError("internal", "INTERNAL_ERROR");
  }
});

// --- Actualizar usuario ---
// eslint-disable-next-line no-undef
exports.adminUpdateUser = onCall(async (request) => {
  try {
    const data = request.data || {};
    const uid = data.uid;
    if (!uid) throw new HttpsError("invalid-argument", "MISSING_UID");

    const patch = {};
    if (typeof data.email === "string") patch.email = data.email.trim();
    if (typeof data.displayName === "string") patch.displayName = data.displayName.trim();
    if (typeof data.phone === "string") patch.phoneNumber = data.phone.trim() || undefined;

    // if (!request.auth || request.auth.token.role !== 'Admin') {
    //   throw new HttpsError("permission-denied", "FORBIDDEN");
    // }

    const userRecord = await admin.auth().updateUser(uid, patch);
    return { uid: userRecord.uid };
  } catch (err) {
    logger.error("adminUpdateUser error:", err);
    if (err instanceof HttpsError) throw err;

    const code = err?.code || "";
    if (code === "auth/user-not-found") {
      throw new HttpsError("not-found", "USER_NOT_FOUND");
    }
    if (code === "auth/email-already-exists") {
      throw new HttpsError("already-exists", "EMAIL_IN_USE");
    }
    throw new HttpsError("internal", "INTERNAL_ERROR");
  }
});


// --- Eliminar usuario ---
// eslint-disable-next-line no-undef
exports.adminDeleteUser = onCall(async (request) => {
  try {
    const data = request.data || {};
    const uid = data.uid;
    if (!uid) throw new HttpsError("invalid-argument", "MISSING_UID");

    // if (!request.auth || request.auth.token.role !== 'Admin') {
    //   throw new HttpsError("permission-denied", "FORBIDDEN");
    // }

    await admin.auth().deleteUser(uid);
    return { ok: true };
  } catch (err) {
    logger.error("adminDeleteUser error:", err);
    if (err instanceof HttpsError) throw err;

    const code = err?.code || "";
    if (code === "auth/user-not-found") {
      throw new HttpsError("not-found", "USER_NOT_FOUND");
    }
    throw new HttpsError("internal", "INTERNAL_ERROR");
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
