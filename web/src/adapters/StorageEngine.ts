const DB_NAME = 'aextrace';
const DB_VERSION = 1;
const STORE = 'kv';

export class StorageEngine {
  private db: IDBDatabase | null = null;

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, DB_VERSION);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains(STORE)) {
          db.createObjectStore(STORE);
        }
      };
      req.onsuccess = () => {
        this.db = req.result;
        resolve();
      };
      req.onerror = () => reject(req.error);
    });
  }

  async set(key: string, value: unknown): Promise<void> {
    if (!this.db) throw new Error('Storage not initialized');
    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction(STORE, 'readwrite');
      const store = tx.objectStore(STORE);
      const req = store.put(value, key);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  async get<T>(key: string): Promise<T | null> {
    if (!this.db) throw new Error('Storage not initialized');
    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction(STORE, 'readonly');
      const store = tx.objectStore(STORE);
      const req = store.get(key);
      req.onsuccess = () => resolve((req.result as T) ?? null);
      req.onerror = () => reject(req.error);
    });
  }

  async delete(key: string): Promise<void> {
    if (!this.db) throw new Error('Storage not initialized');
    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction(STORE, 'readwrite');
      const store = tx.objectStore(STORE);
      const req = store.delete(key);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }
}