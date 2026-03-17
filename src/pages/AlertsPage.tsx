import { useEffect, useState, useCallback } from 'react';
import { safescanQuery, type SafetyAlertRow } from '../lib/supabase';
import { markAlertsRead } from '../hooks/useAlertCount';
import { useRealtimeAlerts } from '../hooks/useRealtimeAlerts';
import type { AlertSeverity } from '../types';

const SEVERITY_CONFIG: Record<AlertSeverity, { bg: string; text: string; border: string; badge: string; badgeBg: string; icon: string; label: string }> = {
  banned:  { bg: 'bg-red-50',    text: 'text-red-700',    border: 'border-red-200',    badge: 'text-red-700',    badgeBg: 'bg-red-100',    icon: 'block',   label: 'ห้ามใช้'  },
  warning: { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200', badge: 'text-orange-700', badgeBg: 'bg-orange-100', icon: 'warning', label: 'เตือนภัย' },
  recall:  { bg: 'bg-yellow-50', text: 'text-yellow-700', border: 'border-yellow-200', badge: 'text-yellow-700', badgeBg: 'bg-yellow-100', icon: 'replay',  label: 'เรียกคืน' },
};

const FILTER_OPTIONS = [
  { value: 'all',     label: 'ทั้งหมด'  },
  { value: 'banned',  label: 'ห้ามใช้'  },
  { value: 'warning', label: 'เตือนภัย' },
  { value: 'recall',  label: 'เรียกคืน' },
];

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: '2-digit' });
}

export function AlertsPage() {
  const [alerts, setAlerts]     = useState<SafetyAlertRow[]>([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState<string | null>(null);
  const [filter, setFilter]     = useState<'all' | AlertSeverity>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    safescanQuery<SafetyAlertRow>('safety_alerts')
      .then(data => {
        if (!data || data.length === 0) {
          setAlerts([]);
          setError(null);
          markAlertsRead(0);
        } else {
          const sorted = [...data].sort((a, b) =>
            new Date(b.alert_date).getTime() - new Date(a.alert_date).getTime()
          );
          setAlerts(sorted);
          setError(null);
          markAlertsRead(sorted.length); // badge resets to 0 when user opens this page
        }
        setLoading(false);
      })
      .catch(err => {
        if (import.meta.env.DEV) console.error('Failed to load alerts:', err);
        setError('ไม่สามารถโหลดแจ้งเตือนได้ กรุณาลองใหม่');
        setLoading(false);
      });
  }, []);

  // Realtime: prepend new alerts as they arrive
  const handleNewAlert = useCallback((newAlert: SafetyAlertRow) => {
    setAlerts(prev => [newAlert, ...prev]);
  }, []);
  useRealtimeAlerts(handleNewAlert);

  const filtered = filter === 'all' ? alerts : alerts.filter(a => a.severity === filter);

  const count = (s: AlertSeverity) => alerts.filter(a => a.severity === s).length;

  return (
    <div className="flex flex-col pb-28 md:pb-8 animate-fadeIn">
      {/* Header */}
      <header className="glassmorphism md:bg-transparent sticky top-0 z-40 px-5 md:px-8 pt-10 md:pt-8 pb-4 border-b border-primary-50 md:border-none animate-slideDown">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">แจ้งเตือนความปลอดภัย</h1>
            <p className="text-sm text-gray-400">สินค้าถูกแบน / เรียกคืน / เตือนภัย</p>
          </div>
          <div className="flex items-center gap-2 bg-green-50 border border-green-200 px-3 py-1.5 rounded-full flex-shrink-0 animate-slideRight">
            <span className="material-symbols-outlined text-green-500 text-sm">verified_user</span>
            <span className="text-xs font-bold text-green-700">อย. ไทย</span>
          </div>
        </div>
        {/* Filter Chips */}
        <div className="flex gap-2 overflow-x-auto hide-scrollbar md:flex-wrap">
          {FILTER_OPTIONS.map((opt, i) => (
            <button
              key={opt.value}
              onClick={() => setFilter(opt.value as typeof filter)}
              style={{ animationDelay: `${i * 50}ms` }}
              className={`px-4 py-1.5 rounded-full text-sm font-semibold whitespace-nowrap transition-all duration-300 flex-shrink-0 animate-fadeIn hover:scale-105 active:scale-95 ${
                filter === opt.value
                  ? 'bg-red-500 text-white shadow-lg shadow-red-300'
                  : 'bg-white border border-gray-200 text-gray-600 hover:border-red-300 hover:shadow-md'
              }`}
            >
              {opt.label}
              {opt.value !== 'all' && !loading && (
                <span className="ml-1 text-xs opacity-70">({count(opt.value as AlertSeverity)})</span>
              )}
            </button>
          ))}
        </div>
      </header>

      <div className="px-5 md:px-8 pt-5 space-y-4">
        {/* Error Banner */}
        {error && (
          <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-2xl p-4 animate-slideDown">
            <span className="material-symbols-outlined text-red-500 flex-shrink-0">error</span>
            <p className="text-sm text-red-700 font-medium">{error}</p>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          {loading ? (
            [1,2,3].map(i => <div key={i} className="bg-gray-100 rounded-2xl p-3 h-14 skeleton" />)
          ) : (
            <>
              <div className="bg-red-50 border border-red-100 rounded-2xl p-3 text-center animate-fadeIn hover:shadow-md transition-shadow duration-300" style={{ animationDelay: '0ms' }}>
                <div className="text-xl font-black text-red-600 transition-transform duration-300 hover:scale-110">{count('banned')}</div>
                <p className="text-xs text-red-500 font-medium mt-0.5">ห้ามใช้</p>
              </div>
              <div className="bg-orange-50 border border-orange-100 rounded-2xl p-3 text-center animate-fadeIn hover:shadow-md transition-shadow duration-300" style={{ animationDelay: '100ms' }}>
                <div className="text-xl font-black text-orange-600 transition-transform duration-300 hover:scale-110">{count('warning')}</div>
                <p className="text-xs text-orange-500 font-medium mt-0.5">เตือนภัย</p>
              </div>
              <div className="bg-yellow-50 border border-yellow-100 rounded-2xl p-3 text-center animate-fadeIn hover:shadow-md transition-shadow duration-300" style={{ animationDelay: '200ms' }}>
                <div className="text-xl font-black text-yellow-600 transition-transform duration-300 hover:scale-110">{count('recall')}</div>
                <p className="text-xs text-yellow-600 font-medium mt-0.5">เรียกคืน</p>
              </div>
            </>
          )}
        </div>

        {/* Skeleton */}
        {loading && (
          <div className="md:grid md:grid-cols-2 md:gap-4 space-y-4 md:space-y-0">
            {[1,2,3,4].map(i => (
              <div key={i} className="bg-white rounded-2xl border border-gray-100 shadow-card overflow-hidden">
                <div className="h-40 skeleton" />
                <div className="p-4 space-y-2">
                  <div className="h-4 w-3/4 skeleton rounded" />
                  <div className="h-3 w-full skeleton rounded" />
                  <div className="h-3 w-2/3 skeleton rounded" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Alert Grid */}
        {!loading && (
          <div className="md:grid md:grid-cols-2 md:gap-4 space-y-4 md:space-y-0">
            {filtered.map((alert, i) => {
              const cfg      = SEVERITY_CONFIG[alert.severity];
              const expanded = expandedId === alert.id;
              return (
                <div
                  key={alert.id}
                  className={`bg-white rounded-2xl border ${cfg.border} shadow-card overflow-hidden animate-fadeUp`}
                  style={{ animationDelay: `${i * 60}ms` }}
                >
                  {/* Image */}
                  <div className="h-40 md:h-48 bg-gray-100 relative overflow-hidden">
                    {alert.image_url && (
                      <img src={alert.image_url} alt={alert.product_name} className="w-full h-full object-cover" loading="lazy" />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                    <div className="absolute top-3 left-3">
                      <span className={`inline-flex items-center gap-1.5 rounded-full ${cfg.badgeBg} ${cfg.badge} border ${cfg.border} px-3 py-1 text-xs font-black uppercase tracking-wide`}>
                        <span className="material-symbols-outlined text-[14px]">{cfg.icon}</span>
                        {cfg.label}
                      </span>
                    </div>
                    <div className="absolute bottom-3 left-3 right-3">
                      <h3 className="text-white font-bold text-lg leading-tight drop-shadow">{alert.product_name}</h3>
                      <p className="text-white/80 text-xs">{alert.brand}</p>
                    </div>
                  </div>

                  <div className="p-4">
                    <div className="flex items-start gap-2 mb-3">
                      <span className={`material-symbols-outlined text-sm ${cfg.text} flex-shrink-0 mt-0.5`}>error</span>
                      <p className={`text-sm font-bold ${cfg.text}`}>{alert.headline}</p>
                    </div>
                    <p className={`text-sm text-gray-600 ${expanded ? '' : 'line-clamp-2'}`}>
                      {alert.description}
                    </p>
                    {alert.affected_batches?.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {alert.affected_batches.map((batch, j) => (
                          <span key={j} className="text-xs bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full font-medium">{batch}</span>
                        ))}
                      </div>
                    )}

                    <button
                      onClick={() => setExpandedId(expanded ? null : alert.id)}
                      className="mt-3 w-full flex items-center justify-between py-2 border-t border-gray-100"
                    >
                      <span className="text-sm font-bold text-gray-700">
                        {expanded ? 'ซ่อนรายละเอียด' : 'ดูรายละเอียด & วิธีปฏิบัติ'}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-400">{formatDate(alert.alert_date)}</span>
                        {alert.source_url && (
                          <a
                            href={alert.source_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={e => e.stopPropagation()}
                            className="text-xs text-primary-500 font-semibold hover:underline"
                          >
                            อย.
                          </a>
                        )}
                        <span className={`material-symbols-outlined text-gray-400 transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`}>
                          expand_more
                        </span>
                      </div>
                    </button>

                    {expanded && (
                      <div className={`mt-3 space-y-3 animate-fadeUp`}>
                        <div className={`p-3 ${cfg.bg} border ${cfg.border} rounded-xl`}>
                          <p className={`text-sm font-semibold ${cfg.text} mb-2`}>รายละเอียด:</p>
                          <p className={`text-sm ${cfg.text} leading-relaxed`}>{alert.description}</p>
                        </div>
                        <div className={`p-3 ${cfg.bg} border ${cfg.border} rounded-xl`}>
                          <p className={`text-sm font-semibold ${cfg.text} mb-2`}>แนะนำการปฏิบัติ:</p>
                          <ul className={`text-sm ${cfg.text} space-y-1 list-disc list-inside`}>
                            <li>หยุดใช้สินค้านี้ทันที</li>
                            <li>อย่านำไปแจกจ่ายหรือขายต่อ</li>
                            <li>ติดต่อผู้จำหน่ายเพื่อขอคืนเงิน</li>
                            {alert.severity === 'recall' && <li>ส่งคืนสินค้าไปยังร้านค้าที่ซื้อ</li>}
                          </ul>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {!loading && filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center animate-fadeIn">
            <span className="material-symbols-outlined text-gray-200 text-7xl mb-3 animate-bounce">check_circle</span>
            <p className="text-gray-400 font-medium">ไม่มีแจ้งเตือนในหมวดนี้</p>
          </div>
        )}
      </div>
    </div>
  );
}
