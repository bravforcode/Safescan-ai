import { Link, useLocation } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useAlertCount } from '../hooks/useAlertCount';

const NAV_ITEMS = [
  { path: '/',          icon: 'home',                  label: 'หน้าหลัก' },
  { path: '/community', icon: 'groups',                label: 'ชุมชน'    },
  { path: '/scan',      icon: 'qr_code_scanner',       label: 'สแกน',    center: true },
  { path: '/diary',     icon: 'menu_book',             label: 'ไดอารี่'   },
  { path: '/profile',   icon: 'person',                label: 'โปรไฟล์'  },
];

export function BottomNav() {
  const { pathname }  = useLocation();
  const { itemCount } = useCart();
  const { user }      = useAuth();
  const alertCount    = useAlertCount();

  return (
    <nav className="md:hidden glassmorphism border-t border-gray-100 fixed bottom-0 left-0 right-0 z-50 pb-safe" aria-label="เมนูหลัก">
      <div className="flex justify-around items-center h-16">
        {NAV_ITEMS.map(item => {
          const active = pathname === item.path;

          if (item.center) {
            return (
              <Link
                key={item.path}
                to={item.path}
                aria-label="สแกนสินค้า"
                className="flex flex-col items-center relative -translate-y-5"
              >
                {active && (
                  <>
                    <span className="absolute inset-0 m-auto w-14 h-14 rounded-full bg-primary-400/30 animate-[pulseRing_1.4s_ease-out_infinite]" />
                    <span className="absolute inset-0 m-auto w-14 h-14 rounded-full bg-primary-400/15 animate-[pulseRing_1.4s_ease-out_0.5s_infinite]" />
                  </>
                )}
                <div className={`relative w-14 h-14 rounded-full flex items-center justify-center shadow-float border-4 border-background
                  transition-all duration-200 press-effect
                  ${active ? 'bg-primary-600 scale-110' : 'bg-primary-500 hover:bg-primary-600'}`}
                >
                  <span className="material-symbols-outlined text-white text-2xl" aria-hidden="true">qr_code_scanner</span>
                </div>
                <span className={`text-[10px] font-bold mt-1 transition-colors ${active ? 'text-primary-600' : 'text-gray-400'}`}>
                  สแกน
                </span>
              </Link>
            );
          }

          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center justify-center w-full h-full gap-0.5 relative transition-colors duration-150 focus-ring
                ${active ? 'text-primary-500' : 'text-gray-400 hover:text-gray-600'}`}
            >
              {/* Active dot */}
              <span
                className={`absolute top-1.5 w-1 h-1 rounded-full bg-primary-500 transition-all duration-300
                  ${active ? 'opacity-100 scale-100' : 'opacity-0 scale-0'}`}
              />
              <span
                className={`material-symbols-outlined transition-all duration-150 ${active ? 'text-[26px]' : 'text-[22px]'}`}
                aria-hidden="true"
              >
                {item.icon}
              </span>
              <span className={`text-[10px] font-medium transition-all ${active ? 'font-bold' : ''}`}>{item.label}</span>

              {/* Cart badge */}
              {item.path === '/cart' && itemCount > 0 && (
                <span className="absolute top-2 left-[calc(50%+4px)] w-4 h-4 bg-red-500 text-white text-[9px] font-black rounded-full flex items-center justify-center border-2 border-white animate-scaleIn">
                  {itemCount > 9 ? '9+' : itemCount}
                </span>
              )}
              {/* Alerts badge */}
              {item.path === '/alerts' && alertCount > 0 && (
                <span className="absolute top-2 left-[calc(50%+4px)] w-2 h-2 bg-red-400 rounded-full animate-beat" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
