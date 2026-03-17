import { lazy, Suspense, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CATEGORIES } from '../data';
import { safescanSelect, type SafetyAlertRow } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

const FeaturedProductsSection = lazy(() =>
  import('../components/FeaturedProductsSection').then(m => ({ default: m.FeaturedProductsSection }))
);

const ALERT_SEVERITY_CONFIG = {
  banned:  { bg: 'bg-red-100',    text: 'text-red-700',    label: 'ห้ามใช้',   icon: 'block'   },
  warning: { bg: 'bg-orange-100', text: 'text-orange-700', label: 'เตือน',    icon: 'warning' },
  recall:  { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'เรียกคืน', icon: 'replay'  },
};

export function HomePage() {
  const { user, profile }           = useAuth();
  const [alerts, setAlerts]         = useState<SafetyAlertRow[]>([]);
  const navigate                    = useNavigate();

  const displayName = profile?.display_name ?? user?.user_metadata?.full_name ?? null;

  useEffect(() => {
    safescanSelect<SafetyAlertRow>(
      'safety_alerts',
      '*',
      undefined,
      { column: 'alert_date', ascending: false },
      10
    ).then(data => setAlerts(data ?? []));
  }, []);

  return (
    <div className="flex flex-col pb-24 md:pb-8">
      {/* Header */}
      <header className="glassmorphism md:bg-transparent sticky top-0 z-40 px-5 md:px-8 pt-10 md:pt-8 pb-4 border-b border-primary-50 md:border-none animate-slideDown">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-primary-500 uppercase tracking-widest mb-0.5 md:hidden">SafeScan AI</p>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
              {displayName ? `สวัสดี, ${displayName}!` : 'สวัสดี!'}
            </h1>
            <p className="text-sm text-gray-400">ตรวจสอบสินค้า รู้จริง ซื้อได้ทันที</p>
          </div>
          <Link
            to={user ? '/profile' : '/login'}
            aria-label="โปรไฟล์"
            className="md:hidden w-11 h-11 rounded-full bg-primary-500 flex items-center justify-center shadow-card press-effect focus-ring overflow-hidden"
          >
            {user?.user_metadata?.avatar_url ? (
              <img src={user.user_metadata.avatar_url} alt="avatar" className="w-full h-full object-cover" />
            ) : (
              <span className="material-symbols-outlined text-white text-xl">person</span>
            )}
          </Link>
        </div>
      </header>

      {/* Global Search for Mobile & Desktop */}
      <div className="px-5 md:px-8 mt-2 md:-mt-2">
        <form 
          onSubmit={(e) => {
            e.preventDefault();
            const q = new FormData(e.currentTarget).get('q');
            if (q) navigate(`/dictionary?q=${encodeURIComponent(q as string)}`);
          }} 
          className="relative group"
        >
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <span className="material-symbols-outlined text-gray-400 group-focus-within:text-primary-500 transition-colors">search</span>
          </div>
          <input
            name="q"
            type="search"
            placeholder="ค้นหาส่วนผสม, E-Number..."
            className="w-full pl-11 pr-4 py-3 bg-white border border-gray-100 rounded-2xl text-sm font-medium text-gray-900 placeholder-gray-400 focus:outline-none focus:border-primary-400 focus:ring-4 focus:ring-primary-50 transition-all shadow-sm"
          />
        </form>
      </div>

      <div className="px-5 md:px-8 pt-6 space-y-8">

        {/* ── Hero Scan Banner ── */}
        <div className="relative bg-gradient-to-br from-primary-500 via-primary-600 to-primary-700 rounded-3xl overflow-hidden shadow-float animate-fadeUp">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-20 -mt-20 pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-40 h-40 bg-white/5 rounded-full -ml-14 -mb-14 pointer-events-none" />

          <div className="relative z-10 p-6 md:p-10">
            <div className="md:flex md:items-center md:gap-10">
              <div className="md:flex-1">
                <div className="flex items-center gap-2 mb-3">
                  <span className="material-symbols-outlined text-cyan-300 text-lg">verified</span>
                  <span className="text-xs font-bold uppercase tracking-widest text-primary-200">ข้อมูลจากโรงงานจริง · Open Food Facts</span>
                </div>
                <h2 className="text-2xl md:text-4xl font-black mb-2 leading-tight text-white">
                  สแกนบาร์โค้ด<br/>รู้ทุกอย่างทันที
                </h2>
                <p className="text-primary-100 text-sm md:text-base mb-6 max-w-sm leading-relaxed">
                  ข้อมูลโภชนาการ ส่วนผสม ความปลอดภัย จากโรงงานผู้ผลิต — พร้อมซื้อได้เลยในคลิกเดียว
                </p>
                <div className="flex flex-wrap gap-3">
                  <Link to="/scan" className="inline-flex items-center gap-2 bg-white text-primary-600 font-bold px-6 py-3 rounded-xl shadow-lg hover:bg-primary-50 transition-colors press-effect focus-ring">
                    <span className="material-symbols-outlined text-lg">qr_code_scanner</span>
                    สแกนเลย
                  </Link>
                  <Link to="/alerts" className="inline-flex items-center gap-2 bg-white/15 hover:bg-white/25 text-white font-semibold px-5 py-3 rounded-xl border border-white/20 transition-colors press-effect">
                    <span className="material-symbols-outlined text-sm">notifications_active</span>
                    แจ้งเตือน
                  </Link>
                </div>
              </div>

              {/* Desktop stats */}
              <div className="hidden md:grid grid-cols-3 gap-3 w-64 flex-shrink-0">
                {[
                  { value: '2M+',               label: 'สินค้า',    icon: 'inventory_2'  },
                  { value: '98%',               label: 'แม่นยำ',   icon: 'verified'     },
                  { value: alerts.length.toString(), label: 'ถูกแบน', icon: 'block'     },
                ].map((s, i) => (
                  <div key={i} className="bg-white/15 backdrop-blur rounded-2xl p-4 text-center border border-white/10">
                    <span className="material-symbols-outlined text-white/70 text-lg block mb-1">{s.icon}</span>
                    <div className="text-2xl font-black text-white">{s.value}</div>
                    <p className="text-xs text-primary-200 mt-0.5">{s.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ── Alert Banner ── */}
        {alerts.length > 0 && (
          <Link
            to="/alerts"
            className="flex items-center gap-3 bg-red-50 border border-red-100 rounded-2xl p-4 hover:shadow-card transition-all duration-200 press-sm animate-fadeUp delay-100"
          >
            <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
              <span className="material-symbols-outlined text-red-500 animate-beat">notifications_active</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-red-700 text-sm">แจ้งเตือนใหม่ {alerts.length} รายการ</p>
              <p className="text-xs text-red-500 truncate mt-0.5">{alerts[0].product_name} — {alerts[0].headline}</p>
            </div>
            <span className="material-symbols-outlined text-red-400 flex-shrink-0">chevron_right</span>
          </Link>
        )}

        {/* ── Trending Products (Lazy-loaded) ── */}
        <Suspense fallback={
          <section className="animate-fadeUp delay-150">
            <div className="flex items-center justify-between mb-3">
              <h2 className="section-title">
                <span className="material-symbols-outlined text-red-500">local_fire_department</span>
                กำลังเป็นที่นิยม
              </h2>
            </div>
            <div className="flex gap-3 overflow-x-auto hide-scrollbar -mx-5 px-5">
              {[1,2,3].map(i => (
                <div key={i} className="flex-shrink-0 w-36 card p-3">
                  <div className="w-full h-24 skeleton rounded-xl mb-2" />
                  <div className="h-3 w-20 skeleton rounded mb-1" />
                  <div className="h-4 w-28 skeleton rounded" />
                </div>
              ))}
            </div>
          </section>
        }>
          <FeaturedProductsSection />
        </Suspense>

        {/* ── Mobile Stats ── */}
        <section className="md:hidden animate-fadeUp delay-250">
          <div className="grid grid-cols-3 gap-3">
            {[
              { value: '2M+',                  label: 'สินค้าในระบบ', color: 'text-primary-600', bg: 'bg-primary-50 border-primary-100' },
              { value: '98%',                  label: 'ความแม่นยำ',   color: 'text-green-600',   bg: 'bg-green-50 border-green-100'     },
              { value: `${alerts.length}`,     label: 'สินค้าถูกแบน', color: 'text-red-500',     bg: 'bg-red-50 border-red-100'         },
            ].map((s, i) => (
              <div key={i} className={`card border p-4 text-center ${s.bg}`}>
                <div className={`text-2xl font-black ${s.color}`}>{s.value}</div>
                <p className="text-[11px] text-gray-400 mt-0.5 leading-snug">{s.label}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── 2-col: Alerts + Quick Scan ── */}
        <div className="md:grid md:grid-cols-2 md:gap-8 space-y-8 md:space-y-0">

          {/* Recent Alerts (live) */}
          <section className="animate-fadeUp delay-300">
            <div className="flex items-center justify-between mb-3">
              <h2 className="section-title">
                <span className="material-symbols-outlined text-red-500">notifications_active</span>
                แจ้งเตือนล่าสุด
              </h2>
              <Link to="/alerts" className="text-xs text-primary-500 font-semibold hover:text-primary-600">ดูทั้งหมด →</Link>
            </div>
            <div className="space-y-2.5">
              {alerts.slice(0, 3).map((alert, i) => {
                const cfg = ALERT_SEVERITY_CONFIG[alert.severity];
                return (
                  <Link
                    key={alert.id}
                    to="/alerts"
                    className="card-interactive flex items-start gap-3 p-4"
                    style={{ animationDelay: `${i * 60}ms` }}
                  >
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${cfg.bg}`}>
                      <span className={`material-symbols-outlined text-sm ${cfg.text}`}>{cfg.icon}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                        <span className={`chip text-[10px] ${cfg.bg} ${cfg.text} border-transparent`}>{cfg.label}</span>
                        <span className="text-[11px] text-gray-400">{new Date(alert.alert_date).toLocaleDateString('th-TH', { day: 'numeric', month: 'short' })}</span>
                      </div>
                      <p className="font-semibold text-gray-900 text-sm truncate">{alert.product_name}</p>
                      <p className="text-xs text-gray-500 line-clamp-1 mt-0.5">{alert.headline}</p>
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>

          {/* Quick Scan Demo */}
          <section className="animate-fadeUp delay-350">
            <h2 className="section-title mb-3">
              <span className="material-symbols-outlined text-green-500">experiment</span>
              ทดลองสแกนตัวอย่าง
            </h2>
            <div className="card p-4 space-y-1.5">
              {[
                { code: '3017620422003', name: 'Nutella',   brand: 'Ferrero',   icon: 'icecream',    color: 'bg-amber-50  text-amber-500'  },
                { code: '7622300489557', name: 'Oreo',      brand: 'Mondelēz',  icon: 'cookie',      color: 'bg-gray-100  text-gray-600'   },
                { code: '8710398519306', name: 'Pringles',  brand: "Kellogg's", icon: 'restaurant',  color: 'bg-red-50    text-red-400'    },
                { code: '5449000000996', name: 'Coca-Cola', brand: 'Coca-Cola', icon: 'local_drink', color: 'bg-red-50    text-red-500'    },
              ].map((item, i) => (
                <Link
                  key={item.code}
                  to="/scan"
                  state={{ autoscan: item.code }}
                  className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 hover:bg-primary-50 hover:shadow-sm transition-all duration-200 press-sm cursor-pointer group border border-transparent hover:border-primary-100"
                  style={{ animationDelay: `${i * 40}ms` }}
                >
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${item.color}`}>
                    <span className="material-symbols-outlined text-lg">{item.icon}</span>
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-sm text-gray-800">{item.name}</p>
                    <p className="text-xs text-gray-400">{item.brand}</p>
                  </div>
                  <span className="material-symbols-outlined text-gray-300 group-hover:text-primary-400 text-sm transition-colors">arrow_forward_ios</span>
                </Link>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
