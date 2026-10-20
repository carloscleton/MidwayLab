// src/services/DirectoryStorageService.ts
// Armazenamento e restauração de FileSystemDirectoryHandle no IndexedDB local do navegador

const DB_NAME = "MidwayLabDirectoryDB";
const STORE_NAME = "directory_handles";
const DB_VERSION = 1;

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined" || !window.indexedDB) {
      return reject(new Error("IndexedDB não disponível"));
    }
    const request = window.indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = (event: any) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = (event: any) => {
      resolve(event.target.result);
    };
    request.onerror = (event: any) => {
      reject(event.target.error);
    };
  });
}

export class DirectoryStorageService {
  static async salvarHandle(key: string, handle: any): Promise<void> {
    try {
      const db = await openDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, "readwrite");
        const store = tx.objectStore(STORE_NAME);
        const req = store.put(handle, key);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      });
    } catch (e) {
      console.warn(`[DirectoryStorageService] Falha ao persistir handle para key '${key}':`, e);
    }
  }

  static async obterHandle(key: string): Promise<any | null> {
    try {
      const db = await openDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, "readonly");
        const store = tx.objectStore(STORE_NAME);
        const req = store.get(key);
        req.onsuccess = () => resolve(req.result || null);
        req.onerror = () => reject(req.error);
      });
    } catch (e) {
      console.warn(`[DirectoryStorageService] Falha ao carregar handle para key '${key}':`, e);
      return null;
    }
  }

  static async verificarOuSolicitarPermissao(handle: any, readWrite: boolean = true): Promise<boolean> {
    if (!handle) return false;
    try {
      const opts = { mode: readWrite ? "readwrite" : "read" };
      // @ts-ignore
      if ((await handle.queryPermission(opts)) === "granted") {
        return true;
      }
      // @ts-ignore
      if ((await handle.requestPermission(opts)) === "granted") {
        return true;
      }
      return false;
    } catch (e) {
      console.warn("[DirectoryStorageService] Erro ao verificar permissões:", e);
      return false;
    }
  }
}
