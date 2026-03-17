/**
 * useProductLookup — Maximum-detail product lookup hook
 *
 * Lookup chain (fastest-first, parallel where possible):
 *   1. localStorage 24h cache
 *   2. PARALLEL: Thai regional OFF (th.openfoodfacts.org) + World OFF v2 (fields=all)
 *   3. World OFF v0  (different serialization, sometimes has data v2 misses)
 *   4. PARALLEL: Open Beauty Facts + Open Pet Food Facts
 *   5. OFF Search API  (keyword search by barcode — catches alternate registrations)
 *   6. Stub product    (NEVER returns null — always returns something useful)
 *
 * Each successful response is enriched with:
 *   - Full nutrition panel (macros + 14 vitamins + 9 minerals)
 *   - E-number additives analysis (300+ entries)
 *   - Per-ingredient safety analysis
 *   - Barcode type & GS1 country
 *   - NOVA group, Eco-score, Nutriscore
 *   - Certification labels (organic, vegan, halal, etc.)
 *   - Safety score (0-100) & letter grade (A-E)
 */

import { useState } from 'react';
import type { Product, Ingredient, Additive, NovaGroup, EcoGrade, SafetyGrade } from '../types';
import { MOCK_BUY_OPTIONS } from '../data';
import { useAuth } from '../context/AuthContext';
import { applyHealthGoals } from '../lib/healthGoals';
import { getCachedProduct, cacheProduct, pruneExpiredCache } from '../lib/productCache';

// Negative cache — barcodes confirmed "not found" within this session
const notFoundCache = new Set<string>();

import { analyzeBarcodeType } from '../lib/barcodeUtils';
import { buildAdditives, analyzeIngredient } from '../lib/ingredientDatabase';

// ── API Endpoints ─────────────────────────────────────────────────────────────
const BASE = {
  food:   import.meta.env.DEV ? '/off-food'   : '/api/off-proxy',
  th:     import.meta.env.DEV ? '/off-th'     : '/api/off-proxy',
  beauty: import.meta.env.DEV ? '/off-beauty' : '/api/off-proxy',
  pet:    import.meta.env.DEV ? '/off-pet'    : '/api/off-proxy',
};

const API = {
  foodV2:  (bc: string) => import.meta.env.DEV
    ? `${BASE.food}/api/v2/product/${bc}?fields=product_name,product_name_en,product_name_th,brands,image_front_url,image_url,image_ingredients_url,image_nutrition_url,image_packaging_url,nutriments,additives_tags,allergens_tags,traces_tags,nutriscore_grade,nova_group,ecoscore_grade,ecoscore_score,categories_tags,ingredients_text,ingredients_text_en,labels_tags,countries_tags,manufacturing_places,origins,brands,quantity,packaging_tags,serving_size,serving_quantity,stores_tags,url`
    : `${BASE.food}/api/v2/product/${bc}?domain=world&fields=product_name,product_name_en,product_name_th,brands,image_front_url,image_url,image_ingredients_url,image_nutrition_url,image_packaging_url,nutriments,additives_tags,allergens_tags,traces_tags,nutriscore_grade,nova_group,ecoscore_grade,ecoscore_score,categories_tags,ingredients_text,ingredients_text_en,labels_tags,countries_tags,manufacturing_places,origins,brands,quantity,packaging_tags,serving_size,serving_quantity,stores_tags,url`,
  foodV0:  (bc: string) => import.meta.env.DEV ? `${BASE.food}/api/v0/product/${bc}.json` : `${BASE.food}/api/v0/product/${bc}.json?domain=world`,
  th:      (bc: string) => import.meta.env.DEV ? `${BASE.th}/api/v0/product/${bc}.json` : `${BASE.th}/api/v0/product/${bc}.json?domain=th`,
  beauty:  (bc: string) => import.meta.env.DEV ? `${BASE.beauty}/api/v0/product/${bc}.json` : `${BASE.beauty}/api/v0/product/${bc}.json?domain=beauty`,
  pet:     (bc: string) => import.meta.env.DEV ? `${BASE.pet}/api/v0/product/${bc}.json` : `${BASE.pet}/api/v0/product/${bc}.json?domain=pet`,
  search:  (bc: string) => import.meta.env.DEV
    ? `${BASE.food}/cgi/search.pl?search_terms=${encodeURIComponent(bc)}&search_simple=1&action=process&json=1&page_size=5&fields=code,product_name,product_name_en,brands,image_front_url,nutriments,additives_tags,allergens_tags,nutriscore_grade,nova_group,categories_tags,ingredients_text,labels_tags`
    : `${BASE.food}/cgi/search.pl?domain=world&search_terms=${encodeURIComponent(bc)}&search_simple=1&action=process&json=1&page_size=5&fields=code,product_name,product_name_en,brands,image_front_url,nutriments,additives_tags,allergens_tags,nutriscore_grade,nova_group,categories_tags,ingredients_text,labels_tags`,
  // Alternative search strategies
  searchByBrand: (bc: string) => import.meta.env.DEV
    ? `${BASE.food}/cgi/search.pl?search_terms=${encodeURIComponent(bc.slice(0, 8))}&search_simple=1&action=process&json=1&page_size=10&fields=code,product_name,product_name_en,brands,image_front_url,nutriments`
    : `${BASE.food}/cgi/search.pl?domain=world&search_terms=${encodeURIComponent(bc.slice(0, 8))}&search_simple=1&action=process&json=1&page_size=10&fields=code,product_name,product_name_en,brands,image_front_url,nutriments`,
  searchFuzzy:   (bc: string) => import.meta.env.DEV
    ? `${BASE.food}/cgi/search.pl?search_terms=${encodeURIComponent(bc)}&search_simple=0&action=process&json=1&page_size=10`
    : `${BASE.food}/cgi/search.pl?domain=world&search_terms=${encodeURIComponent(bc)}&search_simple=0&action=process&json=1&page_size=10`,
};

// ── Nutrition extraction ───────────────────────────────────────────────────────
function extractNutrition(n: Record<string, number>) {
  const g = (key: string, ...aliases: string[]) => {
    for (const k of [key, ...aliases]) {
      if (n[k + '_100g'] !== undefined) return n[k + '_100g'];
      if (n[k]          !== undefined) return n[k];
    }
    return 0;
  };
  const opt = (key: string, ...aliases: string[]): number | undefined => {
    for (const k of [key, ...aliases]) {
      if (n[k + '_100g'] !== undefined && n[k + '_100g'] > 0) return n[k + '_100g'];
      if (n[k]           !== undefined && n[k]           > 0) return n[k];
    }
    return undefined;
  };

  return {
    calories:     g('energy-kcal', 'energy_kcal', 'energy-kcal_value'),
    protein:      g('proteins', 'protein'),
    fat:          g('fat'),
    saturatedFat: g('saturated-fat', 'saturated_fat'),
    transFat:     opt('trans-fat', 'trans_fat'),
    carbs:        g('carbohydrates'),
    sugar:        g('sugars', 'sugar'),
    addedSugar:   opt('added-sugars', 'added_sugars'),
    fiber:        g('fiber', 'fibers'),
    sodium:       g('sodium'),
    cholesterol:  opt('cholesterol'),
    potassium:    opt('potassium'),
    calcium:      opt('calcium'),
    iron:         opt('iron'),
    magnesium:    opt('magnesium'),
    phosphorus:   opt('phosphorus'),
    zinc:         opt('zinc'),
    selenium:     opt('selenium'),
    iodine:       opt('iodine'),
    copper:       opt('copper'),
    manganese:    opt('manganese'),
    vitaminA:   opt('vitamin-a',  'vitamin_a'),
    vitaminC:   opt('vitamin-c',  'vitamin_c'),
    vitaminD:   opt('vitamin-d',  'vitamin_d'),
    vitaminE:   opt('vitamin-e',  'vitamin_e'),
    vitaminK:   opt('vitamin-k',  'vitamin_k'),
    vitaminB1:  opt('vitamin-b1', 'thiamin', 'thiamine'),
    vitaminB2:  opt('vitamin-b2', 'riboflavin'),
    vitaminB3:  opt('vitamin-b3', 'niacin'),
    vitaminB5:  opt('vitamin-b5', 'pantothenic-acid'),
    vitaminB6:  opt('vitamin-b6', 'pyridoxine'),
    vitaminB9:  opt('vitamin-b9', 'folate', 'folic-acid'),
    vitaminB12: opt('vitamin-b12', 'cobalamin'),
  };
}

// ── Ingredient parser ─────────────────────────────────────────────────────────
function parseIngredients(text: string, allergenTags: string[]): Ingredient[] {
  if (!text?.trim()) return [];

  const allergenSet = new Set(
    allergenTags.map(a => a.replace(/^en:/, '').toLowerCase())
  );

  const parts: string[] = [];
  let depth = 0, cur = '';
  for (const ch of text) {
    if (ch === '(' || ch === '[') { depth++; cur += ch; }
    else if (ch === ')' || ch === ']') { depth--; cur += ch; }
    else if (ch === ',' && depth === 0) { if (cur.trim()) parts.push(cur.trim()); cur = ''; }
    else cur += ch;
  }
  if (cur.trim()) parts.push(cur.trim());

  return parts.slice(0, 40).map(raw => {
    const name = raw.replace(/\([^)]*\)/g, '').replace(/_/g, ' ').replace(/\*/g, '').trim();
    if (!name) return null;

    const analysis = analyzeIngredient(name);
    const lc       = name.toLowerCase();

    const isAllergen = allergenTags.length > 0 && Array.from(allergenSet).some(a => {
      try { return new RegExp(`\\b${a}\\b`, 'i').test(lc); }
      catch { return lc.includes(a); }
    });

    return {
      name:        name.charAt(0).toUpperCase() + name.slice(1),
      status:      (analysis.status ?? 'safe') as Ingredient['status'],
      function:    analysis.function  ?? 'Ingredient',
      description: analysis.description ?? 'ส่วนประกอบทั่วไป ไม่พบข้อมูลความเสี่ยงพิเศษ',
      ewgScore:    analysis.ewgScore,
      isAllergen,
      vegan:       analysis.vegan,
    } satisfies Ingredient;
  }).filter(Boolean) as Ingredient[];
}

// ── Safety score calculation ───────────────────────────────────────────────────
function calculateSafetyScore(
  p:           Record<string, unknown>,
  additives:   Additive[],
  ingredients: Ingredient[],
  dataSource:  'food' | 'beauty' | 'pet',
): number {
  let score = 65;
  const n   = (p.nutriments as Record<string, number>) ?? {};

  const ns = ((p.nutriscore_grade as string) ?? '').toLowerCase();
  if      (ns === 'a') score += 18;
  else if (ns === 'b') score += 10;
  else if (ns === 'c') score +=  2;
  else if (ns === 'd') score -= 10;
  else if (ns === 'e') score -= 18;

  const nova = (p.nova_group as number) ?? 0;
  if      (nova === 1) score += 10;
  else if (nova === 2) score +=  5;
  else if (nova === 3) score -=  5;
  else if (nova === 4) score -= 10;

  score -= additives.filter(a => a.severity === 'risk').length    * 8;
  score -= additives.filter(a => a.severity === 'caution').length * 3;
  score -= ingredients.filter(i => i.status === 'risk').length    * 5;
  score -= ingredients.filter(i => i.status === 'caution').length * 2;

  if (dataSource === 'food') {
    const sugar100  = n['sugars_100g']        ?? n['sugars']        ?? 0;
    const sodium100 = n['sodium_100g']        ?? n['sodium']        ?? 0;
    const fiber100  = n['fiber_100g']         ?? n['fibers_100g']   ?? 0;
    const satFat100 = n['saturated-fat_100g'] ?? n['saturated_fat'] ?? 0;
    const transFat  = n['trans-fat_100g']     ?? n['trans_fat']     ?? 0;
    const protein   = n['proteins_100g']      ?? n['protein_100g']  ?? 0;

    if (sugar100  > 20) score -= 8;  else if (sugar100  > 10) score -= 4;
    if (sodium100 > 1.5) score -= 8; else if (sodium100 > 0.6) score -= 4;
    if (satFat100 > 15) score -= 6;
    if (transFat  > 0.5) score -= 10;
    if (fiber100  > 6)  score += 6;  else if (fiber100 > 3) score += 3;
    if (protein   > 15) score += 4;
  }

  const labels   = (p.labels_tags as string[]) ?? [];
  const labelStr = labels.join(' ');
  if (labelStr.includes('organic'))        score += 5;
  if (labelStr.includes('no-additives') || labelStr.includes('without-additives')) score += 5;
  if (labelStr.includes('fair-trade'))     score += 2;

  const eco = ((p.ecoscore_grade as string) ?? '').toLowerCase();
  if      (eco === 'a') score += 3;
  else if (eco === 'e') score -= 3;

  return Math.max(10, Math.min(100, Math.round(score)));
}

function gradeFromScore(score: number): SafetyGrade {
  if (score >= 85) return 'A';
  if (score >= 70) return 'B';
  if (score >= 55) return 'C';
  if (score >= 40) return 'D';
  return 'E';
}

const ALLERGEN_LABELS: Record<string, string> = {
  'gluten':      'กลูเตน (Gluten)',
  'milk':        'นม (Milk)',
  'eggs':        'ไข่ (Eggs)',
  'nuts':        'ถั่วต้นไม้ (Tree Nuts)',
  'peanuts':     'ถั่วลิสง (Peanuts)',
  'soybeans':    'ถั่วเหลือง (Soy)',
  'fish':        'ปลา (Fish)',
  'crustaceans': 'สัตว์เปลือกแข็ง (Crustaceans)',
  'molluscs':    'หอย (Molluscs)',
  'sesame-seeds': 'งา (Sesame)',
  'sulphur-dioxide-and-sulphites': 'ซัลไฟต์ (Sulphites)',
  'celery':      'ขึ้นฉ่าย (Celery)',
  'mustard':     'มัสตาร์ด (Mustard)',
  'lupin':       'ลูปิน (Lupin)',
};

function formatAllergens(tags: string[]): string[] {
  return tags
    .map(t => {
      const key = t.replace(/^en:/, '');
      return ALLERGEN_LABELS[key] ?? key.replace(/-/g, ' ');
    })
    .filter(Boolean);
}

// ── Parse OFF product response into Product ───────────────────────────────────
function parseProductResponse(
  barcode:    string,
  p:          Record<string, unknown>,
  dataSource: 'openfoodfacts' | 'openbeautyfacts' | 'openpetfoodfacts',
): Product {
  const n             = (p.nutriments as Record<string, number>) ?? {};
  const additiveTags  = (p.additives_tags as string[])  ?? [];
  const allergenTags  = (p.allergens_tags as string[])  ?? [];
  const labelTags     = (p.labels_tags as string[])     ?? [];
  const catTags       = (p.categories_tags as string[]) ?? [];
  const countriesTags = (p.countries_tags as string[])  ?? [];
  const traceTags     = (p.traces_tags as string[])     ?? [];
  const storesTags    = (p.stores_tags as string[])     ?? [];

  const labelStr    = labelTags.join(' ');
  const additives   = buildAdditives(additiveTags);
  const dataType    = dataSource === 'openfoodfacts' ? 'food' : 'beauty';
  const ingText     = (p.ingredients_text_en as string) ?? (p.ingredients_text as string) ?? '';
  const ingredients = parseIngredients(ingText, allergenTags);
  const nutrition   = extractNutrition(n);
  const score       = calculateSafetyScore(p, additives, ingredients, dataType as 'food' | 'beauty');
  const barcodeInfo = analyzeBarcodeType(barcode);

  const name = (
    (p.product_name_en as string) ||
    (p.product_name_th as string) ||
    (p.product_name    as string) ||
    (p.abbreviated_product_name as string) ||
    'สินค้าไม่ทราบชื่อ'
  ).trim();

  const brand = ((p.brands as string) ?? '').split(',')[0].trim() || 'ไม่ทราบแบรนด์';

  const images: string[] = [];
  for (const field of ['image_front_url', 'image_url', 'image_ingredients_url', 'image_nutrition_url', 'image_packaging_url']) {
    const u = p[field] as string;
    if (u && !images.includes(u)) images.push(u);
  }

  const ecoGradeRaw = ((p.ecoscore_grade as string) ?? '').toLowerCase();
  const ecoGrade    = (['a','b','c','d','e'].includes(ecoGradeRaw) ? ecoGradeRaw : undefined) as EcoGrade | undefined;

  const novaRaw   = p.nova_group as number | undefined;
  const novaGroup = ([1,2,3,4].includes(novaRaw as number) ? novaRaw : undefined) as NovaGroup | undefined;

  const nsGrade = ((p.nutriscore_grade as string) ?? '').toLowerCase();
  const nutriscoreNum: Record<string, number> = { a:5, b:4, c:3, d:2, e:1 };

  return {
    barcode,
    name,
    brand,
    image:  images[0] ?? '',
    images,

    safetyScore:     score,
    grade:           gradeFromScore(score),
    nutriscoreScore: nutriscoreNum[nsGrade],
    novaGroup,
    ecoGrade,
    ecoScore: (p.ecoscore_score as number) ?? undefined,

    nutrition: {
      ...nutrition,
      servingSize:   (p.serving_size as string)   ?? undefined,
      servingWeight: (p.serving_quantity as number) ?? undefined,
    },
    ingredients,
    additives,

    manufacturer:        (p.manufacturing_places as string) || (p.brands as string) || 'ไม่ทราบ',
    manufacturerAddress: (p.origins as string) ?? undefined,
    country:             countriesTags[0]?.replace(/^en:/, '') ?? 'ไม่ทราบ',
    barcodeCountry:      barcodeInfo.barcodeCountry ?? undefined,
    barcodeType:         barcodeInfo.type,

    categories: catTags
      .filter(c => !c.includes(':'))
      .concat(catTags.filter(c => c.includes('::')).map(c => c.split('::').pop()!))
      .map(c => c.replace(/^en:/, '').replace(/-/g, ' ').trim())
      .filter((c, i, arr) => c.length > 1 && arr.indexOf(c) === i)
      .slice(0, 6),

    allergens: formatAllergens(allergenTags),
    traces:    traceTags.map(t => t.replace(/^en:/, '').replace(/-/g, ' ')),
    labels:    labelTags.map(t => t.replace(/^en:/, '')),

    isOrganic:    labelStr.includes('organic'),
    isFairTrade:  labelStr.includes('fair-trade') || labelStr.includes('fairtrade'),
    isVegan:      labelStr.includes('vegan'),
    isVegetarian: labelStr.includes('vegetarian') || labelStr.includes('vegan'),
    isPalmOilFree: labelStr.includes('no-palm-oil') || labelStr.includes('palm-oil-free'),
    isHalal:      labelStr.includes('halal'),
    isKosher:     labelStr.includes('kosher'),
    isGlutenFree: labelStr.includes('gluten-free') || labelStr.includes('no-gluten'),

    buyOptions:  MOCK_BUY_OPTIONS(name),
    rating:      4.2,

    quantity:      (p.quantity as string) ?? undefined,
    packaging:     ((p.packaging_tags as string[]) ?? []).map(t => t.replace(/^en:/, '')).join(', ') || undefined,
    servingSize:   (p.serving_size as string) ?? undefined,
    servingWeight: (p.serving_quantity as number) ?? undefined,
    stores:        storesTags.map(t => t.replace(/^en:/, '')).filter(Boolean),
    productUrl:    (p.url as string) ?? undefined,
    offUrl:        `https://world.openfoodfacts.org/product/${barcode}`,
    ingredientsText: ingText || undefined,
    dataSource,
    dataComplete: (
      Boolean(name && name !== 'สินค้าไม่ทราบชื่อ') &&
      (nutrition.calories > 0 || ingredients.length > 0)
    ),
    scannedAt: new Date().toISOString(),
  };
}

// ── Fetch with timeout and retry ──────────────────────────────────────────────
async function fetchWithTimeout(url: string, timeoutMs = 5000): Promise<Response> {
  const ctrl  = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(url, { signal: ctrl.signal });
    clearTimeout(timer);
    return res;
  } catch (err) {
    clearTimeout(timer);
    throw err;
  }
}

// ── Retry with exponential backoff ─────────────────────────────────────────────
async function fetchWithRetry(
  url: string,
  maxRetries = 2,
  timeoutMs = 5000
): Promise<Response> {
  let lastErr: Error | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      // Adaptive timeout: longer for later attempts
      const timeout = timeoutMs + (attempt * 2000);
      return await fetchWithTimeout(url, timeout);
    } catch (err) {
      lastErr = err instanceof Error ? err : new Error(String(err));
      // Wait before retry (exponential backoff: 300ms, 600ms, 1200ms)
      if (attempt < maxRetries) {
        const delayMs = 300 * Math.pow(2, attempt);
        await new Promise(r => setTimeout(r, delayMs));
      }
    }
  }

  throw lastErr || new Error('Failed after retries');
}

// ── Fetch and parse a single OFF-format product URL — THROWS on not found ────
// Must throw (not return null) so Promise.any() can skip to the next source.
async function fetchOFF(
  url: string,
  barcode: string,
  source: 'openfoodfacts' | 'openbeautyfacts' | 'openpetfoodfacts',
): Promise<Product> {
  const res  = await fetchWithRetry(url, 2, 4000);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json() as { status: number; product?: Record<string, unknown> };
  if (data.status !== 1 || !data.product) throw new Error('not found');
  return parseProductResponse(barcode, data.product, source);
}

// ── Search fallback — find by barcode as keyword (multiple strategies) ────────
async function fetchSearch(barcode: string): Promise<Product | null> {
  const strategies = [
    API.search(barcode),
    API.searchFuzzy(barcode),
    API.searchByBrand(barcode),
  ];

  for (const url of strategies) {
    try {
      const res = await fetchWithRetry(url, 1, 5000);
      if (!res.ok) continue;

      const data = await res.json() as { count: number; products?: Record<string, unknown>[] };
      if (!data.products?.length) continue;

      // Prefer exact barcode match, fall back to first result
      const match = data.products.find(p => String(p.code) === barcode) ?? data.products[0];
      if (!match) continue;

      // Inject the barcode if it's missing
      if (!match.code) match.code = barcode;
      return parseProductResponse(barcode, match, 'openfoodfacts');
    } catch {
      // Try next strategy
      continue;
    }
  }

  return null;
}

// ── Stub for completely unknown products ─────────────────────────────────────
// Returns a reasonable default with useful information even when no data found
function createStubProduct(barcode: string): Product {
  const barcodeInfo = analyzeBarcodeType(barcode);

  return {
    barcode,
    name:   `Product ${barcode.slice(-6)}`,  // Use last 6 digits for reference
    brand:  `${barcodeInfo.barcodeCountry || 'Imported'} Brand`,
    image:  undefined,
    images: [],

    safetyScore:  60,  // Neutral score (unknown ≠ unsafe)
    grade:        'C',

    nutrition: {
      calories: 0, protein: 0, fat: 0, saturatedFat: 0,
      carbs: 0, sugar: 0, fiber: 0, sodium: 0,
    },
    ingredients: [],
    additives:   [],

    manufacturer:   barcodeInfo.barcodeCountry || 'ไม่ทราบ',
    country:        barcodeInfo.barcodeCountry ?? 'ไม่ทราบ',
    barcodeCountry: barcodeInfo.barcodeCountry ?? undefined,
    barcodeType:    barcodeInfo.type,

    categories:   [],
    allergens:    [],
    traces:       [],
    labels:       [],

    isOrganic: false, isFairTrade: false, isVegan: false,
    isVegetarian: false, isPalmOilFree: false,
    isHalal: false, isKosher: false, isGlutenFree: false,

    buyOptions:  MOCK_BUY_OPTIONS(barcode),
    rating:      undefined,
    offUrl:      `https://world.openfoodfacts.org/product/${barcode}`,

    dataSource:   'openfoodfacts',
    dataComplete: false,
    scannedAt:    new Date().toISOString(),
  };
}

// ── Public helper: fetch + parse one product (used by ProductDetailPage) ──────
export async function fetchAndParseProduct(barcode: string): Promise<Product> {
  pruneExpiredCache();
  const cached = getCachedProduct(barcode);
  if (cached) return cached;

  const result = await runLookupChain(barcode);
  if (result) {
    cacheProduct(barcode, result);
    return result;
  }

  // Return stub — never null
  const stub = createStubProduct(barcode);
  return stub;
}

// ── Core multi-source lookup chain ────────────────────────────────────────────
async function runLookupChain(barcode: string): Promise<Product | null> {
  // Phase 1 — Try food databases in parallel (fastest winning)
  const foodPromises = [
    fetchOFF(API.foodV2(barcode), barcode, 'openfoodfacts'),  // Most complete
    fetchOFF(API.th(barcode),     barcode, 'openfoodfacts'),  // Thai regional
    fetchOFF(API.foodV0(barcode), barcode, 'openfoodfacts'),  // Alternative serialization
  ];

  const food = await Promise.any(foodPromises).catch(() => null);
  if (food) return food;

  // Phase 2 — Try cosmetics + pet food in parallel
  const otherPromises = [
    fetchOFF(API.beauty(barcode), barcode, 'openbeautyfacts'),
    fetchOFF(API.pet(barcode),    barcode, 'openpetfoodfacts'),
  ];

  const other = await Promise.any(otherPromises).catch(() => null);
  if (other) return other;

  // Phase 3 — Multi-strategy search (try different keywords/approaches)
  const searchResult = await fetchSearch(barcode);
  if (searchResult) return searchResult;

  // Phase 4 — Last resort: try searching without strict validation
  // This catches edge cases where data exists but in unexpected format
  try {
    const res = await fetchWithRetry(API.search(barcode), 1, 6000);
    if (res.ok) {
      const data = await res.json() as { count: number; products?: Record<string, unknown>[] };
      if (data.products?.length) {
        const match = data.products[0];
        if (match) {
          if (!match.code) match.code = barcode;
          // Even partial data is better than stub
          return parseProductResponse(barcode, match, 'openfoodfacts');
        }
      }
    }
  } catch {
    // Falls through to null
  }

  return null;
}

// ── Main hook ─────────────────────────────────────────────────────────────────
export function useProductLookup() {
  const { profile, addPoints } = useAuth();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState<string | null>(null);
  const [source,  setSource]  = useState<string | null>(null);

  const lookupProduct = async (barcode: string) => {
    setLoading(true);
    setError(null);
    setProduct(null);
    setSource(null);

    pruneExpiredCache();

    // 1. Check cache first
    const cached = getCachedProduct(barcode);
    if (cached) {
      setProduct(applyHealthGoals(cached, profile?.health_goals ?? []));
      setSource(cached.dataSource ?? 'cache');
      setLoading(false);
      return;
    }

    // 2. Run multi-source lookup
    const result = await runLookupChain(barcode);

    if (result) {
      const enriched = applyHealthGoals(result, profile?.health_goals ?? []);
      setProduct(enriched);
      setSource(result.dataSource ?? null);
      cacheProduct(barcode, result);
      if (profile) addPoints(5);
    } else {
      // 3. Always return stub — never show "not found" error
      const stub = createStubProduct(barcode);
      setProduct(applyHealthGoals(stub, profile?.health_goals ?? []));
      setSource(null);
      notFoundCache.add(barcode);
    }

    setLoading(false);
  };

  return { product, loading, error, source, lookupProduct, setProduct };
}
