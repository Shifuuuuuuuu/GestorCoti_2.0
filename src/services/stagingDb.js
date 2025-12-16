const DB_NAME = "doc_approval_staging";
const DB_VER = 3;
const STORE = "staged_docs";

function openDb() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VER);

    req.onupgradeneeded = () => {
      const db = req.result;

      let store;
      if (!db.objectStoreNames.contains(STORE)) {
        store = db.createObjectStore(STORE, { keyPath: "id" });
      } else {
        store = req.transaction.objectStore(STORE);
      }
      if (!store.indexNames.contains("createdAt")) store.createIndex("createdAt", "createdAt", { unique: false });
      if (!store.indexNames.contains("tipo")) store.createIndex("tipo", "tipo", { unique: false });
      if (!store.indexNames.contains("numero")) store.createIndex("numero", "numero", { unique: false });
      if (!store.indexNames.contains("folioDoc")) store.createIndex("folioDoc", "folioDoc", { unique: false });
      if (!store.indexNames.contains("rutPrincipal")) store.createIndex("rutPrincipal", "rutPrincipal", { unique: false });
      if (!store.indexNames.contains("rutManual")) store.createIndex("rutManual", "rutManual", { unique: false });
    };

    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function txDone(tx) {
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error || new Error("IndexedDB tx error"));
    tx.onabort = () => reject(tx.error || new Error("IndexedDB tx abort"));
  });
}

export async function stagePut(item) {
  const db = await openDb();
  const tx = db.transaction(STORE, "readwrite");
  tx.objectStore(STORE).put(item);
  await txDone(tx);
  db.close();
  return item.id;
}

export async function stageGet(id) {
  const db = await openDb();
  const tx = db.transaction(STORE, "readonly");
  const store = tx.objectStore(STORE);

  const res = await new Promise((resolve, reject) => {
    const req = store.get(id);
    req.onsuccess = () => resolve(req.result || null);
    req.onerror = () => reject(req.error);
  });

  db.close();
  return res;
}

export async function stageDelete(id) {
  const db = await openDb();
  const tx = db.transaction(STORE, "readwrite");
  tx.objectStore(STORE).delete(id);
  await txDone(tx);
  db.close();
}

export async function stageList() {
  const db = await openDb();
  const tx = db.transaction(STORE, "readonly");
  const store = tx.objectStore(STORE);
  const idx = store.index("createdAt");

  const all = await new Promise((resolve, reject) => {
    const req = idx.getAll();
    req.onsuccess = () => resolve(req.result || []);
    req.onerror = () => reject(req.error);
  });

  db.close();

  return all
    .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))
    .map(({ blob, ...rest }) => rest);
}

export async function stageClear() {
  const db = await openDb();
  const tx = db.transaction(STORE, "readwrite");
  tx.objectStore(STORE).clear();
  await txDone(tx);
  db.close();
}
