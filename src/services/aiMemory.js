// src/services/aiMemory.js
import { db, storage } from "@/stores/firebase";
import { addDoc, collection, serverTimestamp, updateDoc } from "firebase/firestore";
import { ref as sRef, uploadBytes } from "firebase/storage";

export async function saveInspection({
  equipo,
  question,
  extraNotes,
  answerRaw,
  files = [],
  userId = null,
}) {
  // Estructura esperada por el AiInspectorView
  const payload = {
    userId: userId || null,       // <-- IMPORTANTE (para where("userId","==",uid))
    createdBy: userId || null,    // <-- opcional, por compatibilidad
    createdAt: serverTimestamp(),

    question: String(question || "").trim(),
    extraNotes: extraNotes || "",
    answerRaw: answerRaw || "",

    // Facilita búsquedas y UI
    codigo: equipo?.codigo || null,
    tipo_equipo: equipo?.tipo_equipo || equipo?.clasificacion1 || null,

    // Equipo como objeto (tu vista lo usa como data.equipo)
    equipo: equipo
      ? {
          id: equipo.id || null,
          codigo: equipo.codigo || null,
          tipo_equipo: equipo.tipo_equipo || null,
          clasificacion1: equipo.clasificacion1 || null,
          equipo: equipo.equipo || null,
          marca: equipo.marca || null,
          modelo: equipo.modelo || null,
          localizacion: equipo.localizacion || null,
          ano: equipo.ano ?? null,
          numero_chasis: equipo.numero_chasis || null,
        }
      : null,

    imagePaths: [],
  };

  // ✅ IMPORTANTE: guardar en ai_inspections (lo que tu view consulta)
  const docRef = await addDoc(collection(db, "ai_inspections"), payload);

  // Subir imágenes a Storage
  const paths = [];
  for (let i = 0; i < files.length; i++) {
    const f = files[i];
    const ext = (f.name?.split(".").pop() || "jpg").toLowerCase();
    const path = `ai_inspections/${docRef.id}/img_${i}_${Date.now()}.${ext}`;
    await uploadBytes(sRef(storage, path), f, { contentType: f.type });
    paths.push(path);
  }

  // Guardar paths en el doc (para poder mostrarlas después)
  if (paths.length) {
    await updateDoc(docRef, { imagePaths: paths });
  }

  return { id: docRef.id, paths };
}
