import { useEffect, useState } from 'react';
import type { Product } from '../types';
import { POPULAR_BARCODES } from '../data';

// Uses the same logic as useProductLookup but batches multiple barcodes
async function fetchOneProduct(barcode: string): Promise<Product | null> {
  try {
    const base = import.meta.env.DEV ? '/off-food' : 'https://world.openfoodfacts.org';
    const res  = await fetch(`${base}/api/v0/product/${barcode}.json`);
    if (!res.ok) return null;
    const json = await res.json();
    if (json.status !== 1 || !json.product) return null;
    const p = json.product;

    const nutriscore = (p.nutriscore_grade ?? '').toLowerCase();
    const gradeMap: Record<string, string> = { a: 'A', b: 'B', c: 'C', d: 'D', e: 'E' };
    const grade = (gradeMap[nutriscore] ?? 'C') as Product['grade'];

    return {
      barcode,
      name:         p.product_name_en ?? p.product_name ?? barcode,
      brand:        p.brands ?? '',
      image:        p.image_front_url ?? p.image_url ?? undefined,
      safetyScore:  grade === 'A' ? 90 : grade === 'B' ? 75 : grade === 'C' ? 60 : 40,
      grade,
      nutrition: {
        calories:     Math.round(p.nutriments?.['energy-kcal_100g'] ?? 0),
        protein:      Math.round((p.nutriments?.proteins_100g ?? 0) * 10) / 10,
        fat:          Math.round((p.nutriments?.fat_100g ?? 0) * 10) / 10,
        saturatedFat: Math.round((p.nutriments?.['saturated-fat_100g'] ?? 0) * 10) / 10,
        carbs:        Math.round((p.nutriments?.carbohydrates_100g ?? 0) * 10) / 10,
        sugar:        Math.round((p.nutriments?.sugars_100g ?? 0) * 10) / 10,
        fiber:        Math.round((p.nutriments?.fiber_100g ?? 0) * 10) / 10,
        sodium:       Math.round((p.nutriments?.sodium_100g ?? 0) * 1000) / 10,
      },
      ingredients:  [],
      additives:    [],
      manufacturer: p.manufacturing_places ?? p.origins ?? '',
      country:      p.countries_tags?.[0]?.replace('en:', '') ?? '',
      categories:   p.categories_tags?.slice(0, 3).map((c: string) => c.replace('en:', '')) ?? [],
      allergens:    p.allergens_tags?.map((a: string) => a.replace('en:', '')) ?? [],
      buyOptions:   [],
      rating:       undefined,
    };
  } catch {
    return null;
  }
}

export function useFeaturedProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    Promise.all(POPULAR_BARCODES.map(b => fetchOneProduct(b.code))).then(results => {
      if (cancelled) return;
      setProducts(results.filter(Boolean) as Product[]);
      setLoading(false);
    });

    return () => { cancelled = true; };
  }, []);

  return { products, loading };
}
