import type {
  KnowledgeNodeData,
  ConnectionData,
  SubjectZoneData,
} from '../types/knowledge';

export interface PalaceSnapshot {
  version: number;
  timestamp: number;
  nodes: KnowledgeNodeData[];
  connections: ConnectionData[];
  zones?: SubjectZoneData[];
}

const DB_NAME = 'MindPalaceVR_DB';
const STORE_NAME = 'palace_store';
const KEY_SNAPSHOT = 'active_palace_snapshot';
const LS_FALLBACK_KEY = 'MINDPALACE_VR_SNAPSHOT_FALLBACK';

export class PersistenceManager {
  private db: IDBDatabase | null = null;
  private isDBReady: boolean = false;
  private onSaveConfirmed?: (timestamp: number) => void;

  constructor(onSaveConfirmed?: (timestamp: number) => void) {
    this.onSaveConfirmed = onSaveConfirmed;
    this.initIDB();
  }

  private async initIDB(): Promise<void> {
    if (typeof window === 'undefined' || !window.indexedDB) {
      console.warn('[Persistence] IndexedDB unavailable, using localStorage fallback');
      this.isDBReady = false;
      return;
    }

    return new Promise((resolve) => {
      try {
        const req = window.indexedDB.open(DB_NAME, 1);

        req.onupgradeneeded = (e: IDBVersionChangeEvent) => {
          const db = (e.target as IDBOpenDBRequest).result;
          if (!db.objectStoreNames.contains(STORE_NAME)) {
            db.createObjectStore(STORE_NAME);
          }
        };

        req.onsuccess = () => {
          this.db = req.result;
          this.isDBReady = true;
          resolve();
        };

        req.onerror = () => {
          console.warn('[Persistence] IndexedDB open error, falling back to localStorage');
          this.isDBReady = false;
          resolve();
        };
      } catch (err) {
        console.warn('[Persistence] IndexedDB init exception:', err);
        this.isDBReady = false;
        resolve();
      }
    });
  }

  /**
   * Saves palace state to IndexedDB and localStorage (redundant persistence).
   */
  public async savePalace(
    nodes: KnowledgeNodeData[],
    connections: ConnectionData[],
    zones?: SubjectZoneData[]
  ): Promise<boolean> {
    const snapshot: PalaceSnapshot = {
      version: 1,
      timestamp: Date.now(),
      nodes,
      connections,
      zones,
    };

    const serialized = JSON.stringify(snapshot);

    // 1. LocalStorage immediate backup
    try {
      localStorage.setItem(LS_FALLBACK_KEY, serialized);
    } catch (e) {
      console.warn('[Persistence] localStorage save failed:', e);
    }

    // 2. IndexedDB primary store
    if (this.isDBReady && this.db) {
      try {
        await new Promise<void>((resolve, reject) => {
          const tx = this.db!.transaction(STORE_NAME, 'readwrite');
          const store = tx.objectStore(STORE_NAME);
          const req = store.put(snapshot, KEY_SNAPSHOT);

          req.onsuccess = () => resolve();
          req.onerror = () => reject(req.error);
        });
      } catch (err) {
        console.warn('[Persistence] IndexedDB write failed:', err);
      }
    }

    this.onSaveConfirmed?.(snapshot.timestamp);
    return true;
  }

  /**
   * Loads palace state from IndexedDB or localStorage fallback.
   */
  public async loadPalace(): Promise<PalaceSnapshot | null> {
    // Try IndexedDB first
    if (!this.isDBReady && window.indexedDB) {
      await this.initIDB();
    }

    if (this.isDBReady && this.db) {
      try {
        const idbSnapshot = await new Promise<PalaceSnapshot | null>((resolve) => {
          const tx = this.db!.transaction(STORE_NAME, 'readonly');
          const store = tx.objectStore(STORE_NAME);
          const req = store.get(KEY_SNAPSHOT);

          req.onsuccess = () => resolve(req.result || null);
          req.onerror = () => resolve(null);
        });

        if (idbSnapshot && idbSnapshot.nodes && idbSnapshot.nodes.length > 0) {
          return idbSnapshot;
        }
      } catch (err) {
        console.warn('[Persistence] IndexedDB read error:', err);
      }
    }

    // Fallback to localStorage
    try {
      const raw = localStorage.getItem(LS_FALLBACK_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && parsed.nodes) {
          return parsed as PalaceSnapshot;
        }
      }
    } catch (e) {
      console.warn('[Persistence] localStorage read error:', e);
    }

    return null;
  }

  /**
   * Resets and clears persisted state.
   */
  public async clearPalace(): Promise<void> {
    try {
      localStorage.removeItem(LS_FALLBACK_KEY);
    } catch (e) {}

    if (this.isDBReady && this.db) {
      try {
        const tx = this.db.transaction(STORE_NAME, 'readwrite');
        tx.objectStore(STORE_NAME).delete(KEY_SNAPSHOT);
      } catch (e) {}
    }
  }
}
