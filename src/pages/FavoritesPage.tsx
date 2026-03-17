import { Link, useNavigate } from 'react-router-dom';
import { useFavorites } from '../hooks/useFavorites';
import { useAuth } from '../context/AuthContext';
import { gradeColorClasses } from '../lib/utils';
import type { FavoriteRow } from '../lib/supabase';

function FavCard({ fav }: { fav: FavoriteRow }) {
  const navigate = useNavigate();
  const { removeFavorite } = useFavorites();

  return (
    <div className="card-interactive flex items-center gap-3 p-4 animate-fadeUp">
      {/* Image */}
      <div
        className="w-14 h-14 rounded-xl overflow-hidden bg-gray-50 border border-gray-100 flex-shrink-0 flex items-center justify-center cursor-pointer"
        onClick={() => navigate(`/product/${fav.barcode}`)}
      >
        {fav.product_image ? (
          <img src={fav.product_image} alt={fav.product_name ?? ''} className="w-full h-full object-contain" loading="lazy" />
        ) : (
          <span className="material-symbols-outlined text-gray-300 text-2xl">inventory_2</span>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0 cursor-pointer" onClick={() => navigate(`/product/${fav.barcode}`)}>
        <p className="text-[11px] text-gray-400">{fav.product_brand ?? '—'}</p>
        <p className="font-semibold text-sm text-gray-900 truncate">{fav.product_name ?? fav.barcode}</p>
        <p className="text-[11px] text-gray-400 mt-0.5">{fav.barcode}</p>
      </div>

      {/* Grade + Remove */}
      <div className="flex items-center gap-2 flex-shrink-0">
        {fav.safety_grade && (
          <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-xs font-black ${gradeColorClasses(fav.safety_grade)}`}>
            {fav.safety_grade}
          </div>
        )}
        <button
          onClick={() => removeFavorite(fav.barcode)}
          className="w-8 h-8 rounded-full flex items-center justify-center text-gray-300 hover:text-red-400 hover:bg-red-50 transition-colors"
          aria-label="ลบออกจากรายการโปรด"
        >
          <span className="material-symbols-outlined text-lg">favorite</span>
        </button>
      </div>
    </div>
  );
}

export function FavoritesPage() {
  const { user } = useAuth();
  const { favorites, loading } = useFavorites();

  return (
    <div className="flex flex-col pb-28 md:pb-8">
      <header className="glassmorphism md:bg-transparent sticky top-0 z-40 px-5 md:px-8 pt-10 md:pt-8 pb-4 border-b border-primary-50 md:border-none animate-slideDown">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">รายการโปรด</h1>
        <p className="text-sm text-gray-400 mt-0.5">สินค้าที่คุณบันทึกไว้</p>
      </header>

      <div className="px-5 md:px-8 pt-6">
        {!user ? (
          <div className="card p-10 text-center animate-fadeUp">
            <span className="material-symbols-outlined text-gray-200 text-6xl block mb-4">favorite</span>
            <p className="font-semibold text-gray-600 mb-1">เข้าสู่ระบบเพื่อบันทึกรายการโปรด</p>
            <p className="text-sm text-gray-400 mb-5">ข้อมูลจะถูกบันทึกไว้ทุกอุปกรณ์</p>
            <Link to="/login" className="btn-primary inline-flex items-center gap-2 px-6 py-2.5">
              <span className="material-symbols-outlined text-sm">person</span>
              เข้าสู่ระบบ
            </Link>
          </div>
        ) : loading ? (
          <div className="space-y-3">
            {[1,2,3].map(i => (
              <div key={i} className="card p-4 flex items-center gap-3">
                <div className="w-14 h-14 rounded-xl skeleton flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 w-20 skeleton rounded" />
                  <div className="h-4 w-40 skeleton rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : favorites.length === 0 ? (
          <div className="card p-10 text-center animate-fadeUp">
            <span className="material-symbols-outlined text-gray-200 text-6xl block mb-4">favorite_border</span>
            <p className="font-semibold text-gray-600 mb-1">ยังไม่มีรายการโปรด</p>
            <p className="text-sm text-gray-400 mb-5">กดหัวใจในหน้าสินค้าเพื่อบันทึก</p>
            <Link to="/scan" className="btn-primary inline-flex items-center gap-2 px-6 py-2.5">
              <span className="material-symbols-outlined text-sm">qr_code_scanner</span>
              สแกนสินค้า
            </Link>
          </div>
        ) : (
          <div className="space-y-2.5">
            <p className="text-sm text-gray-400 mb-1">{favorites.length} รายการ</p>
            {favorites.map(fav => <FavCard key={fav.id} fav={fav} />)}
          </div>
        )}
      </div>
    </div>
  );
}
