import { Link, useLocation } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useAlertCount } from '../hooks/useAlertCount';

const NAV_ITEMS = [
  { path: '/',          icon: 'home',                  label: 'หน้าหลัก'     },
  { path: '/scan',      icon: 'qr_code_scanner',       label: 'สแกนสินค้า'   },
  { path: '/alerts',    icon: 'notifications_active',  label: 'แจ้งเตือน'    },
  { path: '/history',   icon: 'history',               label: 'ประวัติการสแกน' },
  { path: '/diary',     icon: 'menu_book',             label: 'ไดอารี่โภชนาการ' },
  { path: '/dictionary', icon: 'local_library',         label: 'พจนานุกรมส่วนผสม' },
  { path: '/favorites', icon: 'favorite',              label: 'รายการโปรด'   },
  { path: '/community', icon: 'groups',                label: 'ชุมชน'        },
  { path: '/cart',      icon: 'shopping_cart',         label: 'ตะกร้าสินค้า' },
  { path: '/profile',   icon: 'person',                label: 'โปรไฟล์'      },
];

export function Sidebar() {
  const { pathname }  = useLocation();
  const { itemCount } = useCart();
  const { user }      = useAuth();
  const alertCount    = useAlertCount();

  return (
    <aside className="hidden md:flex flex-col fixed left-0 top-0 h-full w-64 bg-white border-r border-primary-50 z-50 shadow-[2px_0_16px_rgba(30,136,229,0.06)]">
      {/* Logo */}
      <div className="px-6 pt-8 pb-6 border-b border-gray-50 animate-fadeIn">
        <div className="flex items-center gap-3 group cursor-default">
          <div className="w-10 h-10 rounded-xl bg-primary-500 flex items-center justify-center shadow-card transition-all duration-300 group-hover:shadow-lg group-hover:scale-105">
            <span className="material-symbols-outlined text-white text-xl transition-transform duration-300 group-hover:rotate-12">health_and_safety</span>
          </div>
          <div>
            <h1 className="font-bold text-gray-900 text-lg leading-none transition-colors duration-200 group-hover:text-primary-600">SafeScan AI</h1>
            <p className="text-[11px] text-primary-500 font-semibold mt-0.5 tracking-wide transition-colors duration-200 group-hover:text-primary-600">สแกน รู้จริง ซื้อได้</p>
          </div>
        </div>
      </div>

      {/* Nav Items */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {NAV_ITEMS.map((item, i) => {
          const active = pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`relative flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group focus-ring animate-fadeIn
                ${active
                  ? 'bg-primary-50 text-primary-600 shadow-sm'
                  : 'text-gray-500 hover:bg-gray-50 hover:text-gray-800 hover:shadow-sm'}`}
              style={{ animationDelay: `${i * 40}ms` }}
            >
              {/* Active bar */}
              <div
                className={`absolute left-0 top-1/2 -translate-y-1/2 w-1 rounded-r-full bg-primary-500 transition-all duration-300
                  ${active ? 'h-7 opacity-100' : 'h-0 opacity-0'}`}
              />
              <span
                className={`material-symbols-outlined text-xl transition-all duration-200
                  ${active ? 'text-primary-500 scale-110' : 'text-gray-400 group-hover:text-gray-600 group-hover:scale-105'}`}
                aria-hidden="true"
              >
                {item.icon}
              </span>
              <span className={`text-sm font-medium transition-all duration-200 ${active ? 'font-semibold' : ''}`}>{item.label}</span>

              {/* Cart badge */}
              {item.path === '/cart' && itemCount > 0 && (
                <span className="ml-auto w-5 h-5 bg-red-500 text-white text-[10px] font-black rounded-full flex items-center justify-center animate-scaleIn shadow-md">
                  {itemCount > 9 ? '9+' : itemCount}
                </span>
              )}
              {/* Alerts live dot */}
              {item.path === '/alerts' && alertCount > 0 && (
                <span className="ml-auto w-2 h-2 bg-red-400 rounded-full animate-beat shadow-sm" aria-label="มีแจ้งเตือนใหม่" />
              )}
              {/* Login hint for auth-required pages */}
              {(item.path === '/history' || item.path === '/favorites') && !user && (
                <span className="ml-auto text-[10px] text-gray-300 font-medium transition-colors duration-200 group-hover:text-gray-400">เข้าสู่ระบบ</span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Bottom */}
      <div className="px-4 pb-6 space-y-3 animate-fadeIn delay-300">
        <Link
          to="/scan"
          className="flex items-center justify-center gap-2 w-full btn-primary py-3.5 rounded-xl text-sm group"
        >
          <span className="material-symbols-outlined text-xl transition-transform duration-200 group-hover:scale-110">qr_code_scanner</span>
          <span className="transition-transform duration-200 group-hover:translate-x-0.5">สแกนสินค้า</span>
        </Link>
        {user ? (
          <p className="text-center text-xs text-gray-400 truncate transition-colors duration-200 hover:text-gray-600">{user.email}</p>
        ) : (
          <Link to="/login" className="block text-center text-xs text-primary-500 font-semibold hover:underline transition-all duration-200 hover:text-primary-600">
            เข้าสู่ระบบ / สมัครสมาชิก
          </Link>
        )}
      </div>
    </aside>
  );
}
