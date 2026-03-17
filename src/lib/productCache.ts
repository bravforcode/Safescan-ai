import type { Product } from '../types';

const CACHE_KEY_PREFIX = 'safescan_product_';
const CACHE_TTL_MS     = 24 * 60 * 60 * 1000; // 24 hours

interface CacheEntry {
  product:   Product;
  cachedAt:  number; // unix ms
  expiresAt: number;
}

/** Store a product lookup result in localStorage with 24-hour TTL */
export function cacheProduct(barcode: string, product: Product): void {
  try {
    const entry: CacheEntry = {
      product,
      cachedAt:  Date.now(),
      expiresAt: Date.now() + CACHE_TTL_MS,
    };
    localStorage.setItem(CACHE_KEY_PREFIX + barcode, JSON.stringify(entry));
  } catch {
    // localStorage full or unavailable — silently ignore
  }
}

/** Retrieve a cached product. Returns null if missing or expired. */
export function getCachedProduct(barcode: string): Product | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY_PREFIX + barcode);
    if (!raw) return null;
    const entry = JSON.parse(raw) as CacheEntry;
    if (Date.now() > entry.expiresAt) {
      localStorage.removeItem(CACHE_KEY_PREFIX + barcode);
      return null;
    }
    return entry.product;
  } catch {
    return null;
  }
}

/** Invalidate a single barcode cache entry */
export function invalidateCache(barcode: string): void {
  try {
    localStorage.removeItem(CACHE_KEY_PREFIX + barcode);
  } catch { /* noop */ }
}

/** Remove all expired SafeScan product cache entries */
export function pruneExpiredCache(): void {
  try {
    const toDelete: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key?.startsWith(CACHE_KEY_PREFIX)) continue;
      const raw = localStorage.getItem(key);
      if (!raw) continue;
      const entry = JSON.parse(raw) as CacheEntry;
      if (Date.now() > entry.expiresAt) toDelete.push(key);
    }
    toDelete.forEach(k => localStorage.removeItem(k));
  } catch { /* noop */ }
}

/** How many minutes ago the product was cached (for UI "last updated" label) */
export function cacheAgeMinutes(barcode: string): number | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY_PREFIX + barcode);
    if (!raw) return null;
    const entry = JSON.parse(raw) as CacheEntry;
    return Math.floor((Date.now() - entry.cachedAt) / 60_000);
  } catch {
    return null;
  }
}
