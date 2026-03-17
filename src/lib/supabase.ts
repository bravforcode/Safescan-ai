import { createClient } from '@supabase/supabase-js';

const url  = import.meta.env.VITE_SUPABASE_URL  as string;
const key  = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

export const supabase = createClient(url, key);

// ── Get current session JWT (for RLS) ──────────────────────
async function getAuthToken(): Promise<string | undefined> {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.access_token;
}

// ── Helper to access safescan schema via REST API ──
const headers = (auth?: string): HeadersInit => ({
  'Content-Type':   'application/json',
  'Accept':         'application/json',
  'Accept-Profile': 'safescan',
  'Content-Profile':'safescan',
  'apikey':         key,
  ...(auth ? { 'Authorization': `Bearer ${auth}` } : {}),
});

export async function safescanSelect<T>(
  table: string,
  select: string = '*',
  filters?: Record<string, string | number>,
  orderBy?: { column: string; ascending: boolean },
  limit?: number
): Promise<T[]> {
  const token    = await getAuthToken();
  const baseUrl  = `${url}/rest/v1/${table}`;
  let   queryUrl = `${baseUrl}?select=${select}`;

  if (filters) {
    for (const [k, v] of Object.entries(filters)) {
      queryUrl += `&${k}=eq.${encodeURIComponent(String(v))}`;
    }
  }

  if (orderBy) {
    queryUrl += `&order=${orderBy.column}.${orderBy.ascending ? 'asc' : 'desc'}`;
  }

  if (limit) {
    queryUrl += `&limit=${limit}`;
  }

  const res = await fetch(queryUrl, {
    method:  'GET',
    headers: headers(token),
  });

  if (!res.ok) {
    const errorText = await res.text();
    
    // Silently return empty array for missing tables or permission issues
    if (res.status === 404 || res.status === 401) {
      if (import.meta.env.DEV) {
        console.warn(`Supabase table '${table}' not accessible (${res.status}). Using fallback data.`);
      }
      return [];
    }
    
    if (import.meta.env.DEV) console.error(`Supabase SELECT failed: ${res.status}`, errorText);
    return [];
  }

  return res.json();
}

export async function safescanInsert<T extends Record<string, unknown>>(
  table: string,
  row: T,
  auth?: string
): Promise<T | null> {
  const token = auth ?? await getAuthToken();
  const res   = await fetch(`${url}/rest/v1/${table}`, {
    method:  'POST',
    headers: { ...headers(token), 'Prefer': 'return=representation' },
    body:    JSON.stringify(row),
  });

  if (!res.ok) {
    if (import.meta.env.DEV) console.error(`Supabase INSERT failed: ${res.status}`, await res.text());
    return null;
  }

  const data = await res.json();
  return Array.isArray(data) ? data[0] : data;
}

export async function safescanUpsert<T extends Record<string, unknown>>(
  table: string,
  rows: T[],
  conflictColumns: string[]
): Promise<boolean> {
  const token = await getAuthToken();
  const res   = await fetch(`${url}/rest/v1/${table}?on_conflict=${conflictColumns.join(',')}`, {
    method:  'POST',
    headers: { ...headers(token), 'Prefer': 'resolution=merge-duplicates,return=minimal' },
    body:    JSON.stringify(rows),
  });

  if (!res.ok) {
    if (import.meta.env.DEV) console.error(`Supabase UPSERT failed: ${res.status}`, await res.text());
    return false;
  }

  return true;
}

export async function safescanUpdate<T extends Record<string, unknown>>(
  table: string,
  row: T,
  filters: Record<string, string | number>
): Promise<T | null> {
  const token = await getAuthToken();
  let   queryUrl = `${url}/rest/v1/${table}`;

  let first = true;
  for (const [k, v] of Object.entries(filters)) {
    queryUrl += `${first ? '?' : '&'}${k}=eq.${encodeURIComponent(String(v))}`;
    first = false;
  }

  const res = await fetch(queryUrl, {
    method:  'PATCH',
    headers: { ...headers(token), 'Prefer': 'return=representation' },
    body:    JSON.stringify(row),
  });

  if (!res.ok) {
    if (import.meta.env.DEV) console.error(`Supabase UPDATE failed: ${res.status}`, await res.text());
    return null;
  }

  if (res.status === 204) return null;

  const data = await res.json();
  return Array.isArray(data) ? data[0] ?? null : data;
}

export async function safescanDelete(
  table: string,
  filters: Record<string, string | number>
): Promise<boolean> {
  const token = await getAuthToken();
  let   queryUrl = `${url}/rest/v1/${table}`;

  let first = true;
  for (const [k, v] of Object.entries(filters)) {
    queryUrl += `${first ? '?' : '&'}${k}=eq.${encodeURIComponent(String(v))}`;
    first = false;
  }

  const res = await fetch(queryUrl, {
    method:  'DELETE',
    headers: headers(token),
  });

  if (!res.ok) {
    if (import.meta.env.DEV) console.error(`Supabase DELETE failed: ${res.status}`, await res.text());
    return false;
  }

  return true;
}

// Legacy alias for backwards compatibility
export const safescanQuery = safescanSelect;

// ── RPC helper (calls Postgres functions via /rpc/) ─────────────────────────
export async function safescanRpc<T = unknown>(
  fnName: string,
  params?: Record<string, unknown>
): Promise<T | null> {
  const token = await getAuthToken();
  const res = await fetch(`${url}/rest/v1/rpc/${fnName}`, {
    method:  'POST',
    headers: headers(token),
    body:    JSON.stringify(params ?? {}),
  });

  if (!res.ok) {
    if (import.meta.env.DEV) console.error(`Supabase RPC '${fnName}' failed: ${res.status}`, await res.text());
    return null;
  }

  if (res.status === 204) return null;
  return res.json() as Promise<T>;
}

// ── Typed helpers for the safescan schema ──────────────────
export type Tables = {
  'safescan.profiles': {
    id: string;
    display_name: string | null;
    avatar_url: string | null;
    allergens: string[];
    dietary: string[];
    health_goals: string[];
    scan_count: number;
    points: number;
    level: number;
    created_at: string;
    updated_at: string;
  };
  'safescan.scan_history': {
    id: string;
    user_id: string;
    barcode: string;
    product_name: string | null;
    product_brand: string | null;
    product_image: string | null;
    safety_grade: string | null;
    safety_score: number | null;
    scanned_at: string;
  };
  'safescan.favorites': {
    id: string;
    user_id: string;
    barcode: string;
    product_name: string | null;
    product_brand: string | null;
    product_image: string | null;
    safety_grade: string | null;
    safety_score: number | null;
    added_at: string;
  };
  'safescan.cart_items': {
    id: string;
    user_id: string;
    barcode: string;
    product_name: string | null;
    product_brand: string | null;
    product_image: string | null;
    quantity: number;
    store_name: string | null;
    store_url: string | null;
    added_at: string;
  };
  'safescan.safety_alerts': {
    id: string;
    product_name: string;
    brand: string | null;
    barcode: string | null;
    severity: 'banned' | 'warning' | 'recall';
    headline: string;
    description: string | null;
    source_url: string | null;
    image_url: string | null;
    affected_batches: string[];
    alert_date: string;
    created_at: string;
  };
  'safescan.notification_prefs': {
    user_id: string;
    alerts_enabled: boolean;
    nutrition_enabled: boolean;
    history_enabled: boolean;
    updated_at: string;
  };
  'safescan.product_reviews': {
    id: string;
    user_id: string;
    user_name: string | null;
    user_avatar: string | null;
    barcode: string;
    product_name: string | null;
    product_brand: string | null;
    product_image: string | null;
    rating: number;
    taste_rating: number | null;
    review_text: string | null;
    likes: number;
    created_at: string;
    updated_at: string;
  };
  'safescan.social_feed': {
    id: string;
    user_id: string;
    action_type: 'scanned' | 'reviewed' | 'achieved_badge';
    product_barcode: string | null;
    content: string | null;
    created_at: string;
  };
  'safescan.consumption_logs': {
    id: string;
    user_id: string;
    barcode: string;
    product_name: string | null;
    product_image: string | null;
    servings: number;
    calories: number | null;
    protein: number | null;
    fat: number | null;
    carbs: number | null;
    sugar: number | null;
    sodium: number | null;
    fiber: number | null;
    consumed_at: string;
  };
  'safescan.price_reports': {
    id: string;
    user_id: string;
    barcode: string;
    store_name: string;
    price_thb: number;
    is_promotion: boolean;
    reported_at: string;
  };
  'safescan.review_likes': {
    user_id: string;
    review_id: string;
  };
};

export type Profile        = Tables['safescan.profiles'];
export type ScanHistoryRow = Tables['safescan.scan_history'];
export type FavoriteRow    = Tables['safescan.favorites'];
export type CartItemRow    = Tables['safescan.cart_items'];
export type SafetyAlertRow = Tables['safescan.safety_alerts'];
export type NotifPrefsRow  = Tables['safescan.notification_prefs'];
export type ProductReviewRow = Tables['safescan.product_reviews'];
export type SocialFeedRow  = Tables['safescan.social_feed'];
export type ConsumptionLogRow = Tables['safescan.consumption_logs'];
export type PriceReportRow   = Tables['safescan.price_reports'];
export type ReviewLikeRow   = Tables['safescan.review_likes'];
