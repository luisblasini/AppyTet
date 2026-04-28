import { useMemo } from 'react';

/**
 * usePricesMap
 * 
 * Optimizes product lookups from O(N) linear search to O(1) Map access.
 * Replaces all scattered `.find()` calls on pricesDb throughout the app.
 * 
 * @param {Array} pricesDb - The full product catalog loaded from Supabase.
 * @returns {{ findProduct: Function, pricesMap: Map }}
 */
export const usePricesMap = (pricesDb) => {
  const pricesMap = useMemo(() => {
    const map = new Map();
    if (!Array.isArray(pricesDb)) return map;

    pricesDb.forEach(p => {
      // Index by numeric ID (string and number variants)
      const id = p.id || p.ID;
      if (id !== undefined && id !== null) {
        map.set(String(id), p);
      }

      // Index by exact name (lowercase trimmed) for fuzzy AI lookups
      const name = (p.Passeio || p.name || '').toLowerCase().trim();
      if (name) {
        map.set(name, p);
      }
    });

    return map;
  }, [pricesDb]);

  /**
   * Find a product by its numeric ID or by its exact name.
   * Returns null if not found — never throws.
   * 
   * @param {string|number|null} id - The product's numeric ID.
   * @param {string|null} name - The product's exact name (as returned by AI).
   * @returns {Object|null} The matched product from pricesDb, or null.
   */
  const findProduct = (id = null, name = null) => {
    if (id !== null && id !== undefined) {
      const byId = pricesMap.get(String(id));
      if (byId) return byId;
    }

    if (name) {
      const normalizedName = name.toLowerCase().trim();
      const byName = pricesMap.get(normalizedName);
      if (byName) return byName;
    }

    return null;
  };

  return { pricesMap, findProduct };
};
