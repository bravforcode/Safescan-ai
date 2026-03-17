import { useEffect, useState } from 'react';
import { safescanSelect } from '../lib/supabase';

const LS_SEEN_KEY = 'safescan_alerts_seen';

// ── Persistent "seen" count (survives page reload) ────────
function getSeenCount(): number {
  return parseInt(localStorage.getItem(LS_SEEN_KEY) ?? '0', 10);
}

export function markAlertsRead(total: number) {
  localStorage.setItem(LS_SEEN_KEY, String(total));
  listeners.forEach(fn => fn(0));
}

// Module-level cache — one request shared across all consumers
let totalCount: number | null = null;
let fetchPromise: Promise<void> | null = null;
const listeners = new Set<(n: number) => void>();

function notify(total: number) {
  totalCount = total;
  const unread = Math.max(0, total - getSeenCount());
  listeners.forEach(fn => fn(unread));
}

async function fetchAlertCount() {
  if (totalCount !== null || fetchPromise) return;
  fetchPromise = (async () => {
    try {
      const data = await safescanSelect('safety_alerts', 'id');
      notify(data?.length ?? 0);
    } catch {
      notify(0);
    }
  })();
}

export function useAlertCount(): number {
  const [count, setCount] = useState<number>(() => {
    if (totalCount !== null) return Math.max(0, totalCount - getSeenCount());
    return 0;
  });

  useEffect(() => {
    if (totalCount !== null) {
      setCount(Math.max(0, totalCount - getSeenCount()));
      return;
    }
    listeners.add(setCount);
    fetchAlertCount();
    return () => { listeners.delete(setCount); };
  }, []);

  return count;
}
