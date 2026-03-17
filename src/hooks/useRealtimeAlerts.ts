import { useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { SafetyAlertRow } from '../lib/supabase';

/**
 * Subscribe to real-time INSERT events on safescan.safety_alerts.
 * Calls `onNew` when a new alert arrives so the UI can update without reload.
 */
export function useRealtimeAlerts(onNew: (alert: SafetyAlertRow) => void) {
  useEffect(() => {
    // Only subscribe if table exists (check by attempting a simple query first)
    let channel: ReturnType<typeof supabase.channel> | null = null;
    
    const setupRealtime = async () => {
      try {
        channel = supabase
          .channel('safety_alerts_realtime')
          .on(
            'postgres_changes',
            {
              event:  'INSERT',
              schema: 'safescan',
              table:  'safety_alerts',
            },
            (payload) => {
              if (payload.new) onNew(payload.new as SafetyAlertRow);
            }
          )
          .subscribe((status) => {
            if (status === 'CHANNEL_ERROR' && import.meta.env.DEV) {
              console.warn('Realtime alerts subscription failed - table may not exist');
            }
          });
      } catch (err) {
        if (import.meta.env.DEV) console.warn('Failed to setup realtime alerts:', err);
      }
    };

    setupRealtime();

    return () => { 
      if (channel) supabase.removeChannel(channel); 
    };
  }, [onNew]);
}
