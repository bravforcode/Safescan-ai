export type SafetyGrade    = 'A' | 'B' | 'C' | 'D' | 'E';
export type IngredientStatus = 'safe' | 'caution' | 'risk';
export type AlertSeverity  = 'banned' | 'warning' | 'recall';
export type NovaGroup      = 1 | 2 | 3 | 4;
export type EcoGrade       = 'a' | 'b' | 'c' | 'd' | 'e';

export interface Nutrition {
  // ── Macronutrients ──────────────────────────────────────
  calories:     number;     // kcal / 100g
  protein:      number;     // g
  fat:          number;     // g
  saturatedFat: number;     // g
  transFat?:    number;     // g
  carbs:        number;     // g
  sugar:        number;     // g
  addedSugar?:  number;     // g
  fiber:        number;     // g
  sodium:       number;     // g (display ×1000 = mg)
  cholesterol?: number;     // mg

  // ── Minerals ────────────────────────────────────────────
  potassium?:   number;     // mg
  calcium?:     number;     // mg
  iron?:        number;     // mg
  magnesium?:   number;     // mg
  phosphorus?:  number;     // mg
  zinc?:        number;     // mg
  selenium?:    number;     // µg
  iodine?:      number;     // µg
  copper?:      number;     // mg
  manganese?:   number;     // mg

  // ── Vitamins ────────────────────────────────────────────
  vitaminA?:   number;      // µg RE
  vitaminC?:   number;      // mg
  vitaminD?:   number;      // µg
  vitaminE?:   number;      // mg
  vitaminK?:   number;      // µg
  vitaminB1?:  number;      // mg  (thiamine)
  vitaminB2?:  number;      // mg  (riboflavin)
  vitaminB3?:  number;      // mg  (niacin)
  vitaminB5?:  number;      // mg  (pantothenic acid)
  vitaminB6?:  number;      // mg
  vitaminB9?:  number;      // µg  (folate)
  vitaminB12?: number;      // µg

  // ── Serving ─────────────────────────────────────────────
  servingSize?:   string;   // e.g. "30g", "1 cup (240ml)"
  servingWeight?: number;   // g/ml
}

export interface Additive {
  code:        string;      // "E102", "E621" etc.
  name:        string;
  function:    string;
  severity:    'safe' | 'caution' | 'risk';
  description: string;
  adi?:        string;      // Acceptable Daily Intake
  restricted?: string;      // Countries with restrictions
}

export interface Ingredient {
  name:        string;
  status:      IngredientStatus;
  function:    string;
  description: string;
  ewgScore?:   number;      // 1-10 (10=most hazardous)
  percent?:    number;      // % in product if declared
  isAllergen?: boolean;
  vegan?:      boolean;
}

export interface BuyOption {
  store:     string;
  storeIcon: string;
  price:     number | null;
  currency:  string;
  searchUrl: string;
  color:     string;
}

export interface Product {
  barcode:   string;
  name:      string;
  brand:     string;
  image?:    string;
  images?:   string[];      // Multiple product images

  // ── Safety Scores ────────────────────────────────────────
  safetyScore:    number;   // 0-100 composite
  grade:          SafetyGrade;
  nutriscoreScore?: number;
  novaGroup?:     NovaGroup;
  ecoGrade?:      EcoGrade;
  ecoScore?:      number;

  // ── Data ────────────────────────────────────────────────
  nutrition:   Nutrition;
  ingredients: Ingredient[];
  additives:   Additive[];

  // ── Origin ──────────────────────────────────────────────
  manufacturer?:        string;
  manufacturerAddress?: string;
  country:              string;
  barcodeCountry?:      string;   // derived from EAN prefix
  barcodeType?:         string;   // EAN-13, UPC-A, EAN-8 etc.

  // ── Classification ───────────────────────────────────────
  categories:     string[];
  allergens:      string[];
  traces?:        string[];       // "may contain" traces

  // ── Labels / Certifications ──────────────────────────────
  isOrganic?:     boolean;
  isFairTrade?:   boolean;
  isVegan?:       boolean;
  isVegetarian?:  boolean;
  isPalmOilFree?: boolean;
  isHalal?:       boolean;
  isKosher?:      boolean;
  isGlutenFree?:  boolean;
  labels?:        string[];       // all raw label tags

  // ── Commercial ───────────────────────────────────────────
  buyOptions:  BuyOption[];
  rating?:     number;

  // ── Meta ────────────────────────────────────────────────
  healthWarnings?:   string[];      // generated from user goals
  quantity?:         string;        // "500g", "1L"
  packaging?:        string;
  servingSize?:      string;
  servingWeight?:    number;
  stores?:           string[];
  productUrl?:       string;
  offUrl?:           string;
  ingredientsText?:  string;        // raw ingredient list from OFF API
  dataSource?:     'openfoodfacts' | 'openbeautyfacts' | 'openpetfoodfacts' | 'unknown';
  dataComplete?:   boolean;
  scannedAt?:      string;
}

export interface CartItem {
  product:   Product;
  buyOption: BuyOption;
  quantity:  number;
}

export interface SafetyAlert {
  id:               string;
  productName:      string;
  brand:            string;
  severity:         AlertSeverity;
  headline:         string;
  description:      string;
  date:             string;
  imageUrl?:        string;
  affectedBatches?: string[];
}
