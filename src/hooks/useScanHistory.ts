import { useEffect, useState, useCallback } from 'react';
import { safescanSelect, safescanInsert, safescanDelete, safescanRpc, type ScanHistoryRow } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import type { Product } from '../types';

export function useScanHistory() {
  const { user } = useAuth();
  const [history, setHistory]  = useState<ScanHistoryRow[]>([]);
  const [loading, setLoading]  = useState(false);

  const fetchHistory = useCallback(async () => {
    if (!user) { setHistory([]); return; }
    setLoading(true);
    const data = await safescanSelect<ScanHistoryRow>(
      'scan_history',
      '*',
      { user_id: user.id },
      { column: 'scanned_at', ascending: false },
      100
    );
    setHistory(data ?? []);
    setLoading(false);
  }, [user]);

  useEffect(() => { fetchHistory(); }, [fetchHistory]);

  const addScan = async (product: Product) => {
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
    const data = await safescanInsert('scan_history', row);
    if (data) setHistory(prev => [data as ScanHistoryRow, ...prev]);

    // Atomic scan_count increment — no race condition
    await safescanRpc('increment_scan_count', { p_user_id: user.id });
  };

  const clearHistory = async () => {
    if (!user) return;
    await safescanDelete('scan_history', { user_id: user.id });
    setHistory([]);
  };

  const deleteItem = async (id: string) => {
    await safescanDelete('scan_history', { id });
    setHistory(prev => prev.filter(h => h.id !== id));
  };

  return { history, loading, addScan, clearHistory, deleteItem };
}
