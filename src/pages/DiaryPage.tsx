import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase, safescanDelete, type ConsumptionLogRow } from '../lib/supabase';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

// Daily limits (WHO / Thai health guidelines)
const LIMITS = { calories: 2000, sugar: 24, sodium: 2000, protein: 50, fat: 65, fiber: 25 };

// ── Delete confirmation ───────────────────────────────────────────────────────
function DeleteConfirmModal({ onConfirm, onCancel }: { onConfirm: () => void; onCancel: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
      <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-xl animate-scaleIn">
        <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
          <span className="material-symbols-outlined text-red-500">delete</span>
        </div>
        <h3 className="text-lg font-bold text-gray-900 text-center mb-2">ล้างรายการวันนี้?</h3>
        <p className="text-sm text-gray-500 text-center mb-6">ข้อมูลการกินของวันนี้จะถูกลบถาวร</p>
        <div className="flex gap-2">
          <button onClick={onCancel} className="flex-1 py-3 rounded-2xl bg-gray-100 text-gray-700 font-semibold text-sm">ยกเลิก</button>
          <button onClick={onConfirm} className="flex-1 py-3 rounded-2xl bg-red-500 text-white font-semibold text-sm">ล้างทั้งหมด</button>
        </div>
      </div>
    </div>
  );
}

// ── Macro bar ─────────────────────────────────────────────────────────────────
function MacroBar({ label, value, max, color, unit }: { label: string; value: number; max: number; color: string; unit: string }) {
  const pct = Math.min((value / max) * 100, 100);
  const over = value > max;
  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
      <p className="text-xs font-bold text-gray-500 mb-2">{label}</p>
      <div className="flex items-baseline gap-1 mb-2">
        <span className="text-2xl font-black text-gray-900 tabular-nums">{Math.round(value)}</span>
        <span className="text-xs text-gray-400">/ {max}{unit}</span>
      </div>
      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 ${over ? 'bg-red-500' : color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      {over && <p className="text-[10px] text-red-500 font-semibold mt-1">เกินเป้าหมาย {Math.round(value - max)}{unit}</p>}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export function DiaryPage() {
  const navigate        = useNavigate();
  const { user }        = useAuth();
  const [logs,          setLogs]          = useState<ConsumptionLogRow[]>([]);
  const [loading,       setLoading]       = useState(true);
  const [showConfirm,   setShowConfirm]   = useState(false);
  const [deletingId,    setDeletingId]    = useState<string | null>(null);

  // ── Fetch today's logs ──────────────────────────────────────────────────────
  const fetchLogs = useCallback(async () => {
    if (!user) { setLoading(false); return; }
    setLoading(true);

    // Today's date range (local timezone)
    const now   = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
    const end   = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).toISOString();

    // Use range filter via custom query string
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;
    const res   = await fetch(
      `${SUPABASE_URL}/rest/v1/consumption_logs?select=*&user_id=eq.${user.id}&consumed_at=gte.${encodeURIComponent(start)}&consumed_at=lt.${encodeURIComponent(end)}&order=consumed_at.desc`,
      {
        headers: {
          'Accept':          'application/json',
          'Accept-Profile':  'safescan',
          'Content-Profile': 'safescan',
          'apikey':          SUPABASE_KEY,
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      }
    );

    const data: ConsumptionLogRow[] = res.ok ? await res.json() : [];
    setLogs(data);
    setLoading(false);
  }, [user]);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  // ── Totals ──────────────────────────────────────────────────────────────────
  const totals = logs.reduce(
    (acc, log) => ({
      calories: acc.calories + (log.calories ?? 0),
      sugar:    acc.sugar    + (log.sugar    ?? 0),
      sodium:   acc.sodium   + (log.sodium   ?? 0),
      protein:  acc.protein  + (log.protein  ?? 0),
      fat:      acc.fat      + (log.fat      ?? 0),
      fiber:    acc.fiber    + (log.fiber    ?? 0),
    }),
    { calories: 0, sugar: 0, sodium: 0, protein: 0, fat: 0, fiber: 0 }
  );

  // ── Delete single entry ─────────────────────────────────────────────────────
  const deleteLog = async (id: string) => {
    setDeletingId(id);
    await safescanDelete('consumption_logs', { id });
    setLogs(prev => prev.filter(l => l.id !== id));
    setDeletingId(null);
  };

  // ── Clear today ─────────────────────────────────────────────────────────────
  const clearToday = async () => {
    setShowConfirm(false);
    await Promise.all(logs.map(l => safescanDelete('consumption_logs', { id: l.id })));
    setLogs([]);
  };

  // ── Not logged in ───────────────────────────────────────────────────────────
  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen px-6 pb-20 animate-fadeIn text-center">
        <div className="w-20 h-20 bg-primary-50 rounded-full flex items-center justify-center mb-6">
          <span className="material-symbols-outlined text-4xl text-primary-500">menu_book</span>
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">ไดอารี่โภชนาการส่วนตัว</h2>
        <p className="text-gray-500 mb-8 max-w-xs">เข้าสู่ระบบเพื่อบันทึกการกิน ติดตามแคลอรี่ น้ำตาล และสารอาหารของคุณในแต่ละวัน</p>
        <button onClick={() => navigate('/login')} className="btn-primary w-full max-w-xs py-3.5 rounded-xl uppercase tracking-wider font-bold">
          เข้าสู่ระบบเพื่อใช้งาน
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col pb-28 md:pb-8 min-h-screen animate-fadeIn">
      {/* Header */}
      <header className="glassmorphism sticky top-0 z-40 px-5 md:px-8 pt-10 md:pt-8 pb-4 border-b border-primary-50 md:border-none animate-slideDown">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary-600 to-indigo-600">ไดอารี่วันนี้</h1>
            <p className="text-sm text-gray-500 mt-0.5 font-medium">
              {new Date().toLocaleDateString('th-TH', { weekday: 'long', day: 'numeric', month: 'long' })}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {logs.length > 0 && (
              <button
                onClick={() => setShowConfirm(true)}
                className="text-xs text-red-400 hover:text-red-500 font-semibold press-sm"
              >
                ล้างวันนี้
              </button>
            )}
            <button
              onClick={() => navigate('/scan')}
              className="w-11 h-11 rounded-full bg-primary-500 text-white flex items-center justify-center shadow-md hover:bg-primary-600 transition-colors"
            >
              <span className="material-symbols-outlined text-xl">add</span>
            </button>
          </div>
        </div>
      </header>

      <div className="px-5 md:px-8 pt-6 space-y-5">
        {loading ? (
          <div className="space-y-4">
            <div className="h-40 bg-gray-100 rounded-3xl animate-pulse" />
            <div className="grid grid-cols-2 gap-3">
              {[1,2,3,4].map(i => <div key={i} className="h-24 bg-gray-100 rounded-2xl animate-pulse" />)}
            </div>
          </div>
        ) : (
          <>
            {/* Calorie card */}
            <div className="bg-gradient-to-br from-primary-600 to-indigo-700 rounded-3xl p-6 text-white shadow-lg animate-fadeUp">
              <div className="flex justify-between items-start mb-5">
                <div>
                  <p className="text-primary-100 text-sm font-medium mb-1">พลังงานที่ได้รับ</p>
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-black tabular-nums">{Math.round(totals.calories)}</span>
                    <span className="text-lg text-primary-200 font-medium">/ {LIMITS.calories} kcal</span>
                  </div>
                </div>
                <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-md">
                  <span className="material-symbols-outlined text-white text-2xl">local_fire_department</span>
                </div>
              </div>
              <div className="h-2.5 bg-white/20 rounded-full overflow-hidden mb-2">
                <div
                  className={`h-full rounded-full transition-all duration-1000 ${totals.calories > LIMITS.calories ? 'bg-red-400' : 'bg-white'}`}
                  style={{ width: `${Math.min((totals.calories / LIMITS.calories) * 100, 100)}%` }}
                />
              </div>
              <p className="text-xs text-primary-100 text-right">
                {totals.calories > LIMITS.calories
                  ? `เกินเป้าหมาย ${Math.round(totals.calories - LIMITS.calories)} kcal`
                  : `เหลืออีก ${Math.round(LIMITS.calories - totals.calories)} kcal`}
              </p>
            </div>

            {/* Macros grid */}
            <div className="grid grid-cols-2 gap-3 animate-fadeUp" style={{ animationDelay: '80ms' }}>
              <MacroBar label="น้ำตาล"   value={totals.sugar}   max={LIMITS.sugar}   color="bg-pink-500"   unit="g" />
              <MacroBar label="โซเดียม"  value={totals.sodium}  max={LIMITS.sodium}  color="bg-purple-500" unit="mg" />
              <MacroBar label="โปรตีน"   value={totals.protein} max={LIMITS.protein} color="bg-blue-500"   unit="g" />
              <MacroBar label="ไขมัน"    value={totals.fat}     max={LIMITS.fat}     color="bg-yellow-500" unit="g" />
            </div>

            {/* Timeline */}
            <div className="animate-fadeUp pt-2" style={{ animationDelay: '160ms' }}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-gray-900">รายการที่กินวันนี้</h3>
                <span className="text-xs font-bold text-primary-500 bg-primary-50 px-2 py-1 rounded-full">{logs.length} รายการ</span>
              </div>

              {logs.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                  <span className="material-symbols-outlined text-gray-300 text-4xl mb-2">restaurant</span>
                  <p className="text-sm font-medium text-gray-500">ยังไม่มีรายการอาหารวันนี้</p>
                  <p className="text-xs text-gray-400 mt-1">สแกนสินค้าแล้วกด "เพิ่มในไดอารี่" เพื่อบันทึก</p>
                  <button onClick={() => navigate('/scan')} className="mt-4 btn-primary py-2 px-5 text-sm">สแกนสินค้า</button>
                </div>
              ) : (
                <div className="space-y-3 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-gray-200 before:to-transparent">
                  {logs.map(log => {
                    const d = new Date(log.consumed_at);
                    const t = `${d.getHours().toString().padStart(2,'0')}:${d.getMinutes().toString().padStart(2,'0')}`;
                    return (
                      <div key={log.id} className="relative flex items-center gap-3 group">
                        <div className="w-10 h-10 rounded-full border-4 border-white bg-primary-100 text-primary-600 shadow-sm flex-shrink-0 relative z-10 flex items-center justify-center">
                          <span className="material-symbols-outlined text-sm">restaurant_menu</span>
                        </div>
                        <div
                          className="flex-1 card p-3 hover:shadow-md transition-shadow cursor-pointer"
                          onClick={() => navigate(`/product/${log.barcode}`)}
                        >
                          <div className="flex justify-between items-start mb-1">
                            <span className="text-[10px] font-bold text-primary-500 bg-primary-50 px-2 py-0.5 rounded-full">{t}</span>
                            <span className="text-xs font-black text-gray-700">{log.calories ?? '—'} kcal</span>
                          </div>
                          <p className="font-bold text-sm text-gray-900 truncate mt-0.5">{log.product_name ?? log.barcode}</p>
                          <p className="text-xs text-gray-500 mt-0.5">{log.servings} serving</p>
                        </div>
                        <button
                          onClick={() => deleteLog(log.id)}
                          disabled={deletingId === log.id}
                          className="w-8 h-8 rounded-full flex items-center justify-center text-gray-300 hover:text-red-400 hover:bg-red-50 transition-colors flex-shrink-0 opacity-0 group-hover:opacity-100"
                          aria-label="ลบรายการ"
                        >
                          <span className="material-symbols-outlined text-lg">
                            {deletingId === log.id ? 'hourglass_empty' : 'close'}
                          </span>
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {showConfirm && <DeleteConfirmModal onConfirm={clearToday} onCancel={() => setShowConfirm(false)} />}
    </div>
  );
}
