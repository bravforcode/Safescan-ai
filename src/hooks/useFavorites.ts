import { useEffect, useState, useCallback } from 'react';
import { safescanSelect, safescanInsert, safescanDelete, type FavoriteRow } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import type { Product } from '../types';

export function useFavorites() {
  const { user } = useAuth();
  const [favorites, setFavorites] = useState<FavoriteRow[]>([]);
  const [loading, setLoading]     = useState(false);

  const fetchFavorites = useCallback(async () => {
    if (!user) { setFavorites([]); return; }
    setLoading(true);
    const data = await safescanSelect<FavoriteRow>(
      'favorites',
      '*',
      { user_id: user.id },
      { column: 'added_at', ascending: false }
    );
    setFavorites(data ?? []);
    setLoading(false);
  }, [user]);

  useEffect(() => { fetchFavorites(); }, [fetchFavorites]);

  const isFavorite = (barcode: string) =>
    favorites.some(f => f.barcode === barcode);

  const addFavorite = async (product: Product) => {
    if (!user) return;
    const row = {
      user_id:       user.id,
      barcode:       product.barcode,
      product_name:  product.name,
      product_brand: product.brand,
      product_image: product.image ?? null,
      safety_grade:  product.grade ?? null,
      safety_score:  product.safetyScore ?? null,
    };
    const data = await safescanInsert('favorites', row);
    if (data) setFavorites(prev => [data as FavoriteRow, ...prev]);
  };

  const removeFavorite = async (barcode: string) => {
    if (!user) return;
    await safescanDelete('favorites', { user_id: user.id, barcode });
    setFavorites(prev => prev.filter(f => f.barcode !== barcode));
  };

  const toggleFavorite = async (product: Product) => {
    if (isFavorite(product.barcode)) await removeFavorite(product.barcode);
    else await addFavorite(product);
  };

  return { favorites, loading, isFavorite, toggleFavorite, addFavorite, removeFavorite };
}
