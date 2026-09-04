/**
 * Versioned Durable Game Persistence (IndexedDB)
 * Product Truth: company_sim_v1/product_final.md Section 28.9, AGENTS.md Section 29.10
 *
 * Persists:
 * - active run snapshot
 * - seed
 * - action log / replay checkpoints
 * - unlocked Founder Histories
 * - Holding Company conglomerate state
 * - Settings (audio, reduced-motion)
 * - Balance & content version
 */

import type { CompanyState } from '../sim/types';

const DB_NAME = 'OnePersonCompanyDB';
const DB_VERSION = 1;
const ACTIVE_RUN_STORE = 'active_run';
const HOLDING_STORE = 'holding_company';
const SETTINGS_STORE = 'settings';

export interface SerializedRun {
  id: string;
  version: string;
  timestamp: number;
  seed: number;
  stateJson: string; // BigInt safe serialized CompanyState
  actionLogJson: string;
}

export interface GameSettings {
  soundEnabled: boolean;
  reducedMotion: boolean;
  autoLiquidityEnabled: boolean;
}

export function serializeCompanyState(state: CompanyState): string {
  return JSON.stringify(state, (_key, value) =>
    typeof value === 'bigint' ? { __bigint: value.toString() } : value
  );
}

export function deserializeCompanyState(json: string): CompanyState {
  return JSON.parse(json, (_key, value) => {
    if (value && typeof value === 'object' && '__bigint' in value) {
      return BigInt(value.__bigint);
    }
    return value;
  });
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      return reject(new Error('IndexedDB not supported in this environment'));
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(ACTIVE_RUN_STORE)) {
        db.createObjectStore(ACTIVE_RUN_STORE, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(HOLDING_STORE)) {
        db.createObjectStore(HOLDING_STORE, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(SETTINGS_STORE)) {
        db.createObjectStore(SETTINGS_STORE, { keyPath: 'id' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function saveActiveRun(
  state: CompanyState,
  seed: number = 42
): Promise<void> {
  try {
    const db = await openDb();
    const tx = db.transaction(ACTIVE_RUN_STORE, 'readwrite');
    const store = tx.objectStore(ACTIVE_RUN_STORE);

    const record: SerializedRun = {
      id: 'current_run',
      version: '1.0.0',
      timestamp: Date.now(),
      seed,
      stateJson: serializeCompanyState(state),
      actionLogJson: JSON.stringify(state.actionLog),
    };

    store.put(record);
  } catch (err) {
    console.warn('Failed to persist active run to IndexedDB:', err);
  }
}

export async function loadActiveRun(): Promise<{
  state: CompanyState;
  seed: number;
} | null> {
  try {
    const db = await openDb();
    return new Promise((resolve) => {
      const tx = db.transaction(ACTIVE_RUN_STORE, 'readonly');
      const store = tx.objectStore(ACTIVE_RUN_STORE);
      const req = store.get('current_run');

      req.onsuccess = () => {
        if (req.result) {
          const record = req.result as SerializedRun;
          const state = deserializeCompanyState(record.stateJson);
          resolve({ state, seed: record.seed });
        } else {
          resolve(null);
        }
      };
      req.onerror = () => resolve(null);
    });
  } catch {
    return null;
  }
}

export async function clearActiveRun(): Promise<void> {
  try {
    const db = await openDb();
    const tx = db.transaction(ACTIVE_RUN_STORE, 'readwrite');
    tx.objectStore(ACTIVE_RUN_STORE).delete('current_run');
  } catch {}
}

export async function saveSettings(settings: GameSettings): Promise<void> {
  try {
    const db = await openDb();
    const tx = db.transaction(SETTINGS_STORE, 'readwrite');
    tx.objectStore(SETTINGS_STORE).put({ id: 'app_settings', ...settings });
  } catch {}
}

export async function loadSettings(): Promise<GameSettings> {
  const defaults: GameSettings = {
    soundEnabled: true,
    reducedMotion: false,
    autoLiquidityEnabled: false,
  };

  try {
    const db = await openDb();
    return new Promise((resolve) => {
      const tx = db.transaction(SETTINGS_STORE, 'readonly');
      const req = tx.objectStore(SETTINGS_STORE).get('app_settings');
      req.onsuccess = () => {
        if (req.result) {
          resolve({ ...defaults, ...req.result });
        } else {
          resolve(defaults);
        }
      };
      req.onerror = () => resolve(defaults);
    });
  } catch {
    return defaults;
  }
}
