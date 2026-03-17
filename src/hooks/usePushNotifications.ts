import { useCallback, useEffect, useState } from 'react';
import { safescanSelect, safescanUpsert, safescanDelete } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

const VAPID_PUBLIC = import.meta.env.VITE_VAPID_PUBLIC_KEY as string;

function urlBase64ToUint8Array(base64: string) {
  const padding = '='.repeat((4 - (base64.length % 4)) % 4);
  const b64     = (base64 + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw     = atob(b64);
  return Uint8Array.from([...raw].map(c => c.charCodeAt(0)));
}

export function usePushNotifications() {
  const { user }         = useAuth();
  const [supported, setSupported]   = useState(false);
  const [subscribed, setSubscribed] = useState(false);
  const [loading, setLoading]       = useState(false);

  useEffect(() => {
    setSupported('serviceWorker' in navigator && 'PushManager' in window);
  }, []);

  useEffect(() => {
    if (!supported || !user) return;
    safescanSelect('push_subscriptions', 'id', { user_id: user.id })
      .then(data => setSubscribed((data?.length ?? 0) > 0));
  }, [supported, user]);

  const subscribe = useCallback(async () => {
    if (!user || !supported) return;
    setLoading(true);
    try {
      const reg = await navigator.serviceWorker.register('/sw.js');
      await navigator.serviceWorker.ready;

      const existing = await reg.pushManager.getSubscription();
      const sub = existing ?? await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC),
      });

      await safescanUpsert('push_subscriptions', [{
        user_id:      user.id,
        subscription: sub.toJSON(),
      }], ['user_id']);

      setSubscribed(true);
    } catch (err) {
      if (import.meta.env.DEV) console.error('Push subscribe error:', err);
    }
    setLoading(false);
  }, [user, supported]);

  const unsubscribe = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const reg = await navigator.serviceWorker.getRegistration('/sw.js');
    const sub = await reg?.pushManager.getSubscription();
    await sub?.unsubscribe();
    await safescanDelete('push_subscriptions', { user_id: user.id });
    setSubscribed(false);
    setLoading(false);
  }, [user]);

  return { supported, subscribed, loading, subscribe, unsubscribe };
}
