import {
  createContext, useContext, useEffect, useState, useCallback, useRef, type ReactNode,
} from 'react';
import type { CartItem, Product, BuyOption } from '../types';
import { safescanSelect, safescanInsert, safescanDelete, safescanUpdate, safescanUpsert, type CartItemRow } from '../lib/supabase';
import { useAuth } from './AuthContext';

interface CartContextType {
  items: CartItem[];
  addItem: (product: Product, buyOption: BuyOption, quantity?: number) => Promise<void>;
  removeItem: (barcode: string, storeName: string) => Promise<void>;
  updateQuantity: (barcode: string, quantity: number) => Promise<void>;
  clearCart: () => Promise<void>;
  total: number;
  itemCount: number;
  syncing: boolean;
}

const CartContext = createContext<CartContextType | null>(null);

// ── localStorage fallback for guests ──────────────────────
const LS_KEY = 'safescan_cart';
const lsGet  = (): CartItem[] => { try { return JSON.parse(localStorage.getItem(LS_KEY) ?? '[]'); } catch { return []; } };
const lsSet  = (items: CartItem[]) => localStorage.setItem(LS_KEY, JSON.stringify(items));

// Convert Supabase row → CartItem (minimal Product shell)
function rowToCartItem(row: CartItemRow): CartItem {
  const product: Product = {
    barcode:      row.barcode,
    name:         row.product_name  ?? row.barcode,
    brand:        row.product_brand ?? '',
    image:        row.product_image ?? undefined,
    safetyScore:  0,
    grade:        'C',
    nutrition:    { calories: 0, protein: 0, fat: 0, saturatedFat: 0, carbs: 0, sugar: 0, fiber: 0, sodium: 0 },
    ingredients:  [],
    additives:    [],
    manufacturer: '',
    country:      '',
    categories:   [],
    allergens:    [],
    buyOptions:   [],
  };
  const buyOption: BuyOption = {
    store:      row.store_name ?? '',
    storeIcon:  '',
    price:      null,
    currency:   'THB',
    searchUrl:  row.store_url  ?? '',
    color:      '#1E88E5',
  };
  return { product, buyOption, quantity: row.quantity };
}

export function CartProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [items, setItems]     = useState<CartItem[]>([]);
  const [syncing, setSyncing] = useState(false);
  // Debounce timers for quantity updates — key = "barcode:storeName"
  const qtyTimers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  // Load cart on user change
  const loadCart = useCallback(async () => {
    if (!user) {
      setItems(lsGet());
      return;
    }
    setSyncing(true);
    const data = await safescanSelect<CartItemRow>(
      'cart_items',
      '*',
      { user_id: user.id },
      { column: 'added_at', ascending: true }
    );
    const dbItems = (data ?? []).map(rowToCartItem);

    // merge localStorage cart into DB (guest → logged-in)
    const ls = lsGet();
    if (ls.length > 0) {
      const rowsToUpsert = ls.map(ci => ({
        user_id:       user.id,
        barcode:       ci.product.barcode,
        product_name:  ci.product.name,
        product_brand: ci.product.brand,
        product_image: ci.product.image ?? null,
        quantity:      ci.quantity,
        store_name:    ci.buyOption.store,
        store_url:     ci.buyOption.searchUrl,
      }));
      await safescanUpsert('cart_items', rowsToUpsert, ['user_id', 'barcode', 'store_name']);
      localStorage.removeItem(LS_KEY);
      const merged = await safescanSelect<CartItemRow>(
        'cart_items',
        '*',
        { user_id: user.id },
        { column: 'added_at', ascending: true }
      );
      setItems((merged ?? []).map(rowToCartItem));
    } else {
      setItems(dbItems);
    }
    setSyncing(false);
  }, [user]);

  useEffect(() => { loadCart(); }, [loadCart]);

  const addItem = async (product: Product, buyOption: BuyOption, quantity = 1) => {
    if (!user) {
      const prev = lsGet();
      const idx  = prev.findIndex(i => i.product.barcode === product.barcode && i.buyOption.store === buyOption.store);
      const next = idx >= 0
        ? prev.map((i, j) => j === idx ? { ...i, quantity: i.quantity + quantity } : i)
        : [...prev, { product, buyOption, quantity }];
      lsSet(next);
      setItems(next);
      return;
    }
    // Optimistic update: update local state before Supabase
    const newItem: CartItem = { product, buyOption, quantity };
    const existingIdx = items.findIndex(i => i.product.barcode === product.barcode && i.buyOption.store === buyOption.store);
    if (existingIdx >= 0) {
      setItems(prev => prev.map((i, j) => j === existingIdx ? { ...i, quantity: i.quantity + quantity } : i));
    } else {
      setItems(prev => [...prev, newItem]);
    }
    // Then sync to Supabase
    await safescanUpsert('cart_items', [{
      user_id:       user.id,
      barcode:       product.barcode,
      product_name:  product.name,
      product_brand: product.brand,
      product_image: product.image ?? null,
      quantity:      existingIdx >= 0 ? items[existingIdx].quantity + quantity : quantity,
      store_name:    buyOption.store,
      store_url:     buyOption.searchUrl,
    }], ['user_id', 'barcode', 'store_name']);
  };

  const removeItem = async (barcode: string, storeName: string) => {
    if (!user) {
      const next = lsGet().filter(i => !(i.product.barcode === barcode && i.buyOption.store === storeName));
      lsSet(next); setItems(next); return;
    }
    // Delete by user_id, barcode, AND store_name to avoid deleting all stores
    await safescanDelete('cart_items', { user_id: user.id, barcode, store_name: storeName });
    setItems(prev => prev.filter(i => !(i.product.barcode === barcode && i.buyOption.store === storeName)));
  };

  const updateQuantity = async (barcode: string, quantity: number) => {
    if (quantity <= 0) {
      const item = items.find(i => i.product.barcode === barcode);
      if (item) await removeItem(barcode, item.buyOption.store);
      return;
    }
    if (!user) {
      const next = lsGet().map(i => i.product.barcode === barcode ? { ...i, quantity } : i);
      lsSet(next); setItems(next); return;
    }
    // Optimistic UI update immediately
    setItems(prev => prev.map(i => i.product.barcode === barcode ? { ...i, quantity } : i));

    // Debounce Supabase write — only flush after 600ms of no further changes
    const key = barcode;
    const existing = qtyTimers.current.get(key);
    if (existing) clearTimeout(existing);
    const timer = setTimeout(async () => {
      qtyTimers.current.delete(key);
      await safescanUpdate('cart_items', { quantity }, { user_id: user.id, barcode });
    }, 600);
    qtyTimers.current.set(key, timer);
  };

  const clearCart = async () => {
    if (!user) { localStorage.removeItem(LS_KEY); setItems([]); return; }
    await safescanDelete('cart_items', { user_id: user.id });
    setItems([]);
  };

  const itemCount = items.reduce((s, i) => s + i.quantity, 0);
  const total     = items.reduce((s, i) => s + (i.buyOption.price ?? 0) * i.quantity, 0);

  return (
    <CartContext.Provider value={{ items, addItem, removeItem, updateQuantity, clearCart, total, itemCount, syncing }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}
