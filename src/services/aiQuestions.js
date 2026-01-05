// src/services/aiQuestions.js
import { db } from "@/stores/firebase";
import {
  collection,
  doc,
  getDocs,
  limit,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  increment,
} from "firebase/firestore";

function normalizeKey(s) {
  return String(s || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/\s+/g, " ")
    .slice(0, 240);
}

// hash chico para evitar ids enormes
function djb2Hash(str) {
  let h = 5381;
  for (let i = 0; i < str.length; i++) h = (h * 33) ^ str.charCodeAt(i);
  return (h >>> 0).toString(16);
}

function makeIdFromText(text) {
  const key = normalizeKey(text);
  return `q_${djb2Hash(key)}_${key.replace(/[^a-z0-9]+/g, "_").slice(0, 80)}`;
}

export async function upsertQuestion({ text, userId = null }) {
  const clean = String(text || "").trim();
  if (!clean) return null;

  const key = normalizeKey(clean);
  const id = makeIdFromText(clean);
  const ref = doc(db, "ai_questions", id);

  await runTransaction(db, async (tx) => {
    const snap = await tx.get(ref);

    if (!snap.exists()) {
      tx.set(ref, {
        text: clean,
        key,
        createdAt: serverTimestamp(),
        lastUsedAt: serverTimestamp(),
        timesUsed: 1,
        createdBy: userId || null,
      });
    } else {
      tx.update(ref, {
        text: clean, // por si cambió mayúsculas
        key,
        lastUsedAt: serverTimestamp(),
        timesUsed: increment(1),
      });
    }
  });

  return { id, text: clean, key };
}

export async function fetchQuestions({ max = 50 } = {}) {
  const qy = query(
    collection(db, "ai_questions"),
    orderBy("lastUsedAt", "desc"),
    limit(max)
  );
  const snap = await getDocs(qy);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}
