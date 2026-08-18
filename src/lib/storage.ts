/**
 * localStorage persistence.
 *
 * Previously every recipe, cookbook, meal plan and grocery item lived only in
 * React state, so a page refresh silently discarded everything the user had
 * entered. These helpers persist state and revive `Date` fields, which JSON
 * round-tripping would otherwise leave as strings.
 */

const PREFIX = 'flavourfolio';

export const StorageKeys = {
  recipes: `${PREFIX}:recipes`,
  cookbooks: `${PREFIX}:cookbooks`,
  mealPlans: `${PREFIX}:mealPlans`,
  groceries: `${PREFIX}:groceries`,
  preferences: `${PREFIX}:preferences`,
  user: `${PREFIX}:user`,
  seeded: `${PREFIX}:seeded`,
} as const;

function available(): boolean {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return false;
    const probe = `${PREFIX}:probe`;
    window.localStorage.setItem(probe, '1');
    window.localStorage.removeItem(probe);
    return true;
  } catch {
    // Safari private mode and blocked third-party storage both throw here.
    return false;
  }
}

const STORAGE_OK = available();

/** ISO-8601 date-time, as produced by Date.prototype.toJSON. */
const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/;

function reviveDates(_key: string, value: unknown): unknown {
  if (typeof value === 'string' && ISO_DATE_RE.test(value)) {
    const d = new Date(value);
    if (!Number.isNaN(d.getTime())) return d;
  }
  return value;
}

export function loadState<T>(key: string, fallback: T): T {
  if (!STORAGE_OK) return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    if (raw === null) return fallback;
    const parsed = JSON.parse(raw, reviveDates) as T;
    return parsed ?? fallback;
  } catch {
    // Corrupt or partially-written entry: fall back rather than crash boot.
    return fallback;
  }
}

export function saveState(key: string, value: unknown): void {
  if (!STORAGE_OK) return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    // Most likely QuotaExceededError. Losing a write is better than a crash,
    // but it should be visible to anyone debugging.
    console.warn(`[storage] Could not persist "${key}":`, err);
  }
}

export function clearAll(): void {
  if (!STORAGE_OK) return;
  for (const key of Object.values(StorageKeys)) {
    try {
      window.localStorage.removeItem(key);
    } catch {
      /* nothing useful to do */
    }
  }
}

export function isStorageAvailable(): boolean {
  return STORAGE_OK;
}

/** Rough byte size of everything we have stored, for the settings screen. */
export function storageFootprint(): number {
  if (!STORAGE_OK) return 0;
  let total = 0;
  for (const key of Object.values(StorageKeys)) {
    const raw = window.localStorage.getItem(key);
    if (raw) total += raw.length + key.length;
  }
  return total;
}
