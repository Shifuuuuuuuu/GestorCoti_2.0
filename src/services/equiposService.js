// src/services/equiposService.js
import { db } from "@/stores/firebase";
import { collection, getDocs, limit, orderBy, query } from "firebase/firestore";


export async function fetchEquiposList(max = 300) {
  try {
    const q = query(collection(db, "equipos"), orderBy("codigo"), limit(max));
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  } catch (e) {
    const q2 = query(collection(db, "equipos"), limit(max));
    const snap = await getDocs(q2);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  }
}
