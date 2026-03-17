import { Link, useNavigate } from 'react-router-dom';
import { useState, useMemo } from 'react';
import { useScanHistory } from '../hooks/useScanHistory';
import { useAuth } from '../context/AuthContext';
import { timeAgo, gradeColorClasses } from '../lib/utils';
import type { ScanHistoryRow } from '../lib/supabase';
import { ProductImage } from '../components/ProductImage';

function exportHistoryCSV(history: ScanHistoryRow[]) {
  const header = 'วันที่,ชื่อสินค้า,แบรนด์,บาร์โค้ด,เกรด,คะแนนความปลอดภัย';
  const rows = history.map(h => {
    const date = new Date(h.scanned_at).toLocaleString('th-TH');
    const name  = (h.product_name  ?? '').replace(/,/g, ' ');
    const brand = (h.product_brand ?? '').replace(/,/g, ' ');
    return `"${date}","${name}","${brand}","${h.barcode}","${h.safety_grade ?? ''}","${h.safety_score ?? ''}"`;
  });
  const csv  = [header, ...rows].join('\n');
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = `safescan_history_${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

function HistoryCard({ item, i }: { item: ScanHistoryRow; i: number }) {
  const navigate = useNavigate();
  const { deleteItem } = useScanHistory();

  return (
    <div
      className="card-interactive flex items-center gap-3 p-4 animate-fadeUp"
      style={{ animationDelay: `${i * 40}ms` }}
    >
      <div
        className="w-12 h-12 rounded-xl overflow-hidden bg-gray-50 border border-gray-100 flex-shrink-0 flex items-center justify-center cursor-pointer"
        onClick={() => navigate(`/product/${item.barcode}`)}
      >
        <ProductImage src={item.product_image} alt={item.product_name ?? ''} iconClassName="text-gray-300 text-xl" />
      </div>

      <div className="flex-1 min-w-0 cursor-pointer" onClick={() => navigate(`/product/${item.barcode}`)}>
        <p className="text-[11px] text-gray-400">{item.product_brand ?? '—'}</p>
        <p className="font-semibold text-sm text-gray-900 truncate">{item.product_name ?? item.barcode}</p>
        <p className="text-[11px] text-gray-400 mt-0.5 flex items-center gap-1">
          <span className="material-symbols-outlined text-[12px]">schedule</span>
          {timeAgo(item.scanned_at)}
        </p>
      </div>

      <div className="flex items-center gap-2 flex-shrink-0">
        {item.safety_grade && (
          <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-xs font-black ${gradeColorClasses(item.safety_grade)}`}>
            {item.safety_grade}
          </div>
        )}
        <button
          onClick={() => deleteItem(item.id)}
          className="w-8 h-8 rounded-full flex items-center justify-center text-gray-300 hover:text-red-400 hover:bg-red-50 transition-colors"
          aria-label="ลบออกจากประวัติ"
        >
          <span className="material-symbols-outlined text-lg">close</span>
        </button>
      </div>
    </div>
  );
}

const GRADES = ['A','B','C','D','E'] as const;

export function HistoryPage() {
  const { user } = useAuth();
  const { history, loading, clearHistory } = useScanHistory();
  const [showConfirm, setShowConfirm] = useState(false);
  const [search,      setSearch]      = useState('');
  const [gradeFilter, setGradeFilter] = useState<string>('');

  const filtered = useMemo(() => {
    let list = history;
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(h =>
        (h.product_name  ?? '').toLowerCase().includes(q) ||
        (h.product_brand ?? '').toLowerCase().includes(q) ||
        h.barcode.includes(q)
      );
    }
    if (gradeFilter) list = list.filter(h => h.safety_grade === gradeFilter);
    return list;
  }, [history, search, gradeFilter]);

  const handleClearHistory = async () => {
    setShowConfirm(false);
    await clearHistory();
  };

  return (
    <div className="flex flex-col pb-28 md:pb-8">
      <header className="glassmorphism md:bg-transparent sticky top-0 z-40 px-5 md:px-8 pt-10 md:pt-8 pb-4 border-b border-primary-50 md:border-none animate-slideDown">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">ประวัติการสแกน</h1>
            <p className="text-sm text-gray-400 mt-0.5">สินค้าที่คุณเคยสแกน</p>
          </div>
          {history.length > 0 && (
            <div className="flex items-center gap-3">
              <button
                onClick={() => exportHistoryCSV(history)}
                className="flex items-center gap-1 text-xs text-primary-500 hover:text-primary-600 font-semibold press-sm"
                title="ดาวน์โหลด CSV"
              >
                <span className="material-symbols-outlined text-sm">download</span>
                CSV
              </button>
              <button
                onClick={() => setShowConfirm(true)}
                className="text-xs text-red-400 hover:text-red-500 font-semibold press-sm"
              >
                ล้างทั้งหมด
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Confirmation Modal */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-xl animate-scaleIn">
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-red-100 mx-auto mb-4">
              <span className="material-symbols-outlined text-red-500">delete</span>
            </div>
            <h3 className="text-lg font-bold text-gray-900 text-center mb-2">ล้างประวัติทั้งหมด?</h3>
            <p className="text-sm text-gray-500 text-center mb-6">จะลบประวัติการสแกนของคุณอย่างถาวร ไม่สามารถยกเลิกได้</p>
            <div className="flex gap-2">
              <button
                onClick={() => setShowConfirm(false)}
                className="flex-1 py-3 rounded-2xl bg-gray-100 text-gray-700 font-semibold text-sm hover:bg-gray-200 transition-colors"
              >
                ยกเลิก
              </button>
              <button
                onClick={handleClearHistory}
                className="flex-1 py-3 rounded-2xl bg-red-500 text-white font-semibold text-sm hover:bg-red-600 transition-colors"
              >
                ล้างทั้งหมด
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Search + grade filter */}
      {history.length > 0 && (
        <div className="px-5 md:px-8 pt-4 space-y-3">
          <div className="relative">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-lg">search</span>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="ค้นหาชื่อสินค้า แบรนด์ หรือบาร์โค้ด..."
              className="w-full pl-9 pr-4 py-2.5 bg-gray-100 border border-transparent rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-300 focus:bg-white transition-colors"
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2">
                <span className="material-symbols-outlined text-gray-400 text-lg">close</span>
              </button>
            )}
          </div>
          <div className="flex gap-2 overflow-x-auto hide-scrollbar">
            <button
              onClick={() => setGradeFilter('')}
              className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-colors ${!gradeFilter ? 'bg-primary-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
            >
              ทั้งหมด
            </button>
            {GRADES.map(g => (
              <button
                key={g}
                onClick={() => setGradeFilter(prev => prev === g ? '' : g)}
                className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-colors ${gradeFilter === g ? 'bg-primary-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
              >
                เกรด {g}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="px-5 md:px-8 pt-6">
        {!user ? (
          <div className="card p-10 text-center animate-fadeUp">
            <span className="material-symbols-outlined text-gray-200 text-6xl block mb-4">history</span>
            <p className="font-semibold text-gray-600 mb-1">เข้าสู่ระบบเพื่อบันทึกประวัติ</p>
            <p className="text-sm text-gray-400 mb-5">ระบบจะบันทึกสินค้าที่คุณสแกนทุกครั้ง</p>
            <Link to="/login" className="btn-primary inline-flex items-center gap-2 px-6 py-2.5">
              <span className="material-symbols-outlined text-sm">person</span>
              เข้าสู่ระบบ
            </Link>
          </div>
        ) : loading ? (
          <div className="space-y-3">
            {[1,2,3,4].map(i => (
              <div key={i} className="card p-4 flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl skeleton flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 w-20 skeleton rounded" />
                  <div className="h-4 w-36 skeleton rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : history.length === 0 ? (
          <div className="card p-10 text-center animate-fadeUp">
            <span className="material-symbols-outlined text-gray-200 text-6xl block mb-4">history_toggle_off</span>
            <p className="font-semibold text-gray-600 mb-1">ยังไม่มีประวัติการสแกน</p>
            <p className="text-sm text-gray-400 mb-5">เริ่มสแกนสินค้าเพื่อเก็บประวัติ</p>
            <Link to="/scan" className="btn-primary inline-flex items-center gap-2 px-6 py-2.5">
              <span className="material-symbols-outlined text-sm">qr_code_scanner</span>
              สแกนสินค้า
            </Link>
          </div>
        ) : (
          <div className="space-y-2.5">
            <p className="text-sm text-gray-400 mb-1">
              {filtered.length !== history.length
                ? `${filtered.length} / ${history.length} รายการ`
                : `${history.length} รายการล่าสุด`}
              {' · กด CSV เพื่อส่งออก'}
            </p>
            {filtered.length === 0 && (
              <div className="text-center py-10 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                <span className="material-symbols-outlined text-gray-300 text-4xl mb-2">search_off</span>
                <p className="text-sm text-gray-500">ไม่พบสินค้าที่ค้นหา</p>
              </div>
            )}
            {filtered.map((item, i) => <HistoryCard key={item.id} item={item} i={i} />)}
          </div>
        )}
      </div>
    </div>
  );
}
