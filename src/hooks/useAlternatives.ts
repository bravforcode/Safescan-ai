/**
 * useAlternatives — Find safer/better alternative products in the same category
 *
 * Uses Open Food Facts search API to find products in the same category
 * with a higher safety score than the current product.
 */

import { useState } from 'react';
import type { Product } from '../types';
import { MOCK_BUY_OPTIONS } from '../data';

interface AlternativeProduct {
  barcode:      string;
  name:         string;
  brand:        string;
  image:        string;
  safetyScore:  number;
  grade:        Product['grade'];
  nutriscoreGrade?: string;
  novaGroup?:   number;
  categories:   string[];
}

function gradeFromScore(score: number): Product['grade'] {
  if (score >= 85) return 'A';
  if (score >= 70) return 'B';
  if (score >= 55) return 'C';
  if (score >= 40) return 'D';
  return 'E';
}

function quickScore(p: Record<string, unknown>): number {
  let score = 65;
  const ns = ((p.nutriscore_grade as string) ?? '').toLowerCase();
  if      (ns === 'a') score += 18;
  else if (ns === 'b') score += 10;
  else if (ns === 'c') score +=  2;
  else if (ns === 'd') score -= 10;
  else if (ns === 'e') score -= 18;

  const nova = p.nova_group as number ?? 0;
  if      (nova === 1) score += 10;
  else if (nova === 2) score +=  5;
  else if (nova === 3) score -=  5;
  else if (nova === 4) score -= 10;

  const additives = ((p.additives_tags as string[]) ?? []).length;
  score -= Math.min(additives * 3, 18);

  return Math.max(10, Math.min(100, Math.round(score)));
}

export function useAlternatives() {
  const [alternatives, setAlternatives] = useState<AlternativeProduct[]>([]);
  const [loading,      setLoading]      = useState(false);

  const fetchAlternatives = async (product: Product) => {
    if (!product || product.categories.length === 0) return;

    setLoading(true);
    setAlternatives([]);

    try {
      // Build a category tag from the first meaningful category
      const cat = product.categories
        .find(c => c.length > 3 && !c.startsWith('en:'))
        ?? product.categories[0];

      if (!cat) { setLoading(false); return; }

      // OFF search API — search by category, sorted by nutriscore
      const catTag = cat.toLowerCase().replace(/\s+/g, '-');
      const url = `https://world.openfoodfacts.org/cgi/search.pl?action=process&tagtype_0=categories&tag_contains_0=contains&tag_0=${encodeURIComponent(catTag)}&sort_by=unique_scans_n&page_size=20&json=1&fields=code,product_name,product_name_en,brands,image_front_url,nutriscore_grade,nova_group,additives_tags,categories_tags`;

      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), 6000);

      let data: { products?: Record<string, unknown>[] } = {};
      try {
        const res = await fetch(url, { signal: ctrl.signal });
        data = await res.json();
      } finally {
        clearTimeout(timer);
      }

      const products = data.products ?? [];
      const results: AlternativeProduct[] = products
        .filter(p => {
          const code = p.code as string;
          if (!code || code === product.barcode) return false;
          const name = (p.product_name_en as string) || (p.product_name as string);
          return Boolean(name?.trim());
        })
        .map(p => {
          const score = quickScore(p);
          const name  = ((p.product_name_en as string) || (p.product_name as string) || '').trim();
          const brand = ((p.brands as string) ?? '').split(',')[0].trim();
          const catsList = ((p.categories_tags as string[]) ?? [])
            .map((c: string) => c.replace(/^en:/, '').replace(/-/g, ' '))
            .slice(0, 3);

          return {
            barcode:      p.code as string,
            name:         name.charAt(0).toUpperCase() + name.slice(1),
            brand,
            image:        (p.image_front_url as string) ?? '',
            safetyScore:  score,
            grade:        gradeFromScore(score),
            nutriscoreGrade: (p.nutriscore_grade as string) ?? undefined,
            novaGroup:    (p.nova_group as number) ?? undefined,
            categories:   catsList,
          } satisfies AlternativeProduct;
        })
        // Only show alternatives that score higher than current product
        .filter(a => a.safetyScore > product.safetyScore)
        .sort((a, b) => b.safetyScore - a.safetyScore)
        .slice(0, 4);

      setAlternatives(results);
    } catch {
      // Silently fail — alternatives are a "nice to have"
    } finally {
      setLoading(false);
    }
  };

  return { alternatives, loading, fetchAlternatives };
}

export type { AlternativeProduct };
export { MOCK_BUY_OPTIONS };
