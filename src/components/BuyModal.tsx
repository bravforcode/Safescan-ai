import { useState } from 'react';
import type { Product, BuyOption } from '../types';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';

interface BuyModalProps {
  product: Product;
  onClose: () => void;
}

const MAX_QTY = 99;

const STORE_SVG: Record<string, JSX.Element> = {
  'Lazada TH': (
    <svg viewBox="0 0 48 48" className="w-7 h-7" fill="none">
      <rect width="48" height="48" rx="12" fill="#F57226"/>
      <text x="24" y="32" textAnchor="middle" fill="white" fontSize="18" fontWeight="800" fontFamily="Arial">L</text>
    </svg>
  ),
  'Shopee TH': (
    <svg viewBox="0 0 48 48" className="w-7 h-7" fill="none">
      <rect width="48" height="48" rx="12" fill="#EE4D2D"/>
      <text x="24" y="32" textAnchor="middle" fill="white" fontSize="18" fontWeight="800" fontFamily="Arial">S</text>
    </svg>
  ),
  'Tops Online': (
    <svg viewBox="0 0 48 48" className="w-7 h-7" fill="none">
      <rect width="48" height="48" rx="12" fill="#E8202A"/>
      <text x="24" y="32" textAnchor="middle" fill="white" fontSize="18" fontWeight="800" fontFamily="Arial">T</text>
    </svg>
  ),
  'Makro': (
    <svg viewBox="0 0 48 48" className="w-7 h-7" fill="none">
      <rect width="48" height="48" rx="12" fill="#E30613"/>
      <text x="24" y="32" textAnchor="middle" fill="white" fontSize="18" fontWeight="800" fontFamily="Arial">M</text>
    </svg>
  ),
  "Lotus's": (
    <svg viewBox="0 0 48 48" className="w-7 h-7" fill="none">
      <rect width="48" height="48" rx="12" fill="#00B14F"/>
      <text x="24" y="32" textAnchor="middle" fill="white" fontSize="18" fontWeight="800" fontFamily="Arial">L</text>
    </svg>
  ),
  'Big C': (
    <svg viewBox="0 0 48 48" className="w-7 h-7" fill="none">
      <rect width="48" height="48" rx="12" fill="#00A551"/>
      <text x="24" y="32" textAnchor="middle" fill="white" fontSize="18" fontWeight="800" fontFamily="Arial">B</text>
    </svg>
  ),
  Amazon: (
    <svg viewBox="0 0 48 48" className="w-7 h-7" fill="none">
      <rect width="48" height="48" rx="12" fill="#FF9900"/>
      <text x="24" y="32" textAnchor="middle" fill="white" fontSize="16" fontWeight="800" fontFamily="Arial">A</text>
    </svg>
  ),
  iHerb: (
    <svg viewBox="0 0 48 48" className="w-7 h-7" fill="none">
      <rect width="48" height="48" rx="12" fill="#5BA300"/>
      <text x="24" y="32" textAnchor="middle" fill="white" fontSize="14" fontWeight="800" fontFamily="Arial">iH</text>
    </svg>
  ),
};

export function BuyModal({ product, onClose }: BuyModalProps) {
  const [selectedOption, setSelectedOption] = useState<BuyOption>(product.buyOptions[0]);
  const [quantity, setQuantity] = useState(1);
  const [success, setSuccess] = useState(false);
  
  const [showReportForm, setShowReportForm] = useState(false);
  const [reportStore, setReportStore] = useState('');
  const [reportPrice, setReportPrice] = useState('');
  const [reportPromo, setReportPromo] = useState(false);
  const [reportLoading, setReportLoading] = useState(false);

  const { addItem } = useCart();
  const { showToast } = useToast();
  const { user } = useAuth();

  const handleAddToCart = () => {
    addItem(product, selectedOption, quantity);
    setSuccess(true);
    showToast(`เพิ่ม "${product.name}" ในตะกร้าแล้ว`);
    setTimeout(onClose, 900);
  };

  const handleBuyNow = () => {
    window.open(selectedOption.searchUrl, '_blank', 'noopener,noreferrer');
  };

  const handleReportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportStore || !reportPrice || !user) return;
    
    setReportLoading(true);
    try {
      const { error } = await supabase.from('price_reports').insert({
        user_id: user.id,
        barcode: product.barcode,
        store_name: reportStore,
        price_thb: parseFloat(reportPrice),
        is_promotion: reportPromo,
      });
      if (error) throw error;
      
      showToast('ขอบคุณที่รายงานราคาออฟไลน์!');
      setTimeout(onClose, 1000);
    } catch (err) {
      console.error(err);
      showToast('เกิดข้อผิดพลาด กรุณาลองใหม่');
    } finally {
      setReportLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center" onClick={onClose}>
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-fadeIn" />

      {/* Sheet */}
      <div
        className="relative bg-white rounded-t-3xl md:rounded-3xl w-full max-w-md p-6 pb-8 shadow-2xl animate-slideUp"
        onClick={e => e.stopPropagation()}
      >
        {/* Drag handle */}
        <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-5 md:hidden" />

        {/* Success state */}
        {success ? (
          <div className="flex flex-col items-center justify-center py-8 gap-3 animate-scaleIn">
            <div className="w-16 h-16 rounded-full bg-green-50 border-2 border-green-300 flex items-center justify-center animate-popIn">
              <span className="material-symbols-outlined text-green-500 text-3xl">check</span>
            </div>
            <p className="font-bold text-gray-800 text-lg">เพิ่มลงตะกร้าแล้ว!</p>
            <p className="text-sm text-gray-400 text-center">{product.name}</p>
          </div>
        ) : (
          <>
            {/* Product Header */}
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 rounded-xl bg-gray-50 flex items-center justify-center overflow-hidden flex-shrink-0 border border-gray-100">
                {product.image ? (
                  <img src={product.image} alt={product.name} className="w-full h-full object-contain p-1" />
                ) : (
                  <span className="material-symbols-outlined text-gray-300 text-2xl">inventory_2</span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[11px] text-gray-400 font-medium">{product.brand}</p>
                <h3 className="font-bold text-gray-900 text-sm leading-snug line-clamp-2">{product.name}</h3>
                <div className="flex items-center gap-1.5 mt-1.5">
                  <span className="text-xs font-bold text-green-700 bg-green-50 border border-green-200 px-2 py-0.5 rounded-full">
                    เกรด {product.grade}
                  </span>
                  <span className="text-xs text-gray-400">{product.safetyScore}/100</span>
                </div>
              </div>
            </div>

            {/* Quantity */}
            <div className="flex items-center justify-between mb-5 p-3 bg-gray-50 rounded-2xl transition-all duration-200 hover:bg-gray-100">
              <span className="font-semibold text-gray-700 text-sm">จำนวน</span>
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setQuantity(q => Math.max(1, q - 1))}
                  disabled={quantity <= 1}
                  aria-label="ลดจำนวน"
                  className="w-9 h-9 rounded-xl bg-white shadow-sm flex items-center justify-center text-primary-500 font-bold border border-gray-100 press-effect disabled:opacity-30 cursor-pointer transition-all duration-200 hover:shadow-md hover:border-primary-200"
                >
                  <span className="material-symbols-outlined text-sm">remove</span>
                </button>
                <span className="font-black text-gray-900 w-6 text-center tabular-nums text-base transition-transform duration-200 hover:scale-110">{quantity}</span>
                <button
                  onClick={() => setQuantity(q => Math.min(MAX_QTY, q + 1))}
                  disabled={quantity >= MAX_QTY}
                  aria-label="เพิ่มจำนวน"
                  className="w-9 h-9 rounded-xl bg-white shadow-sm flex items-center justify-center text-primary-500 font-bold border border-gray-100 press-effect disabled:opacity-30 cursor-pointer transition-all duration-200 hover:shadow-md hover:border-primary-200"
                >
                  <span className="material-symbols-outlined text-sm">add</span>
                </button>
              </div>
            </div>

            {showReportForm ? (
              <form onSubmit={handleReportSubmit} className="mt-4 animate-scaleIn border-t border-gray-100 pt-4">
                <p className="font-bold text-gray-800 mb-4 text-center flex items-center justify-center gap-2">
                  <span className="material-symbols-outlined text-primary-500 text-lg">storefront</span>
                  รายงานราคาออฟไลน์หน้าร้าน
                </p>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-400 mb-1">ชื่อร้าน (เช่น 7-11 สาทรซอย 1)</label>
                    <input
                      type="text"
                      required
                      value={reportStore}
                      onChange={e => setReportStore(e.target.value)}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-primary-400 focus:bg-white transition-colors duration-200"
                      placeholder="ระบุสาขาถ้าเป็นไปได้"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-xs font-bold text-gray-400 mb-1">ราคา (บาท)</label>
                    <input
                      type="number"
                      step="0.25"
                      min="0"
                      required
                      value={reportPrice}
                      onChange={e => setReportPrice(e.target.value)}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-primary-400 focus:bg-white transition-colors duration-200"
                      placeholder="0.00"
                    />
                  </div>

                  <div className="flex items-center gap-2 mt-2">
                    <input
                      type="checkbox"
                      id="promo"
                      checked={reportPromo}
                      onChange={e => setReportPromo(e.target.checked)}
                      className="w-4 h-4 text-primary-500 rounded border-gray-300 focus:ring-primary-500"
                    />
                    <label htmlFor="promo" className="text-sm text-gray-600 cursor-pointer">
                      เป็นราคาช่วงโปรโมชั่นลดราคา
                    </label>
                  </div>
                </div>

                <div className="flex gap-3 mt-6">
                  <button
                    type="button"
                    onClick={() => setShowReportForm(false)}
                    className="flex-1 py-2 rounded-xl text-sm font-bold text-gray-500 bg-gray-100 hover:bg-gray-200 transition-colors"
                  >
                    ยกเลิก
                  </button>
                  <button
                    type="submit"
                    disabled={reportLoading || !reportStore || !reportPrice || !user}
                    className="flex-1 py-2 rounded-xl text-sm font-bold text-white bg-primary-500 hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex justify-center items-center"
                  >
                    {reportLoading ? (
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      'ส่งรายงาน'
                    )}
                  </button>
                </div>
                {!user && (
                  <p className="mt-3 text-xs text-center text-red-500">
                    กรุณาเข้าสู่ระบบเพื่อใช้งานฟังก์ชันนี้
                  </p>
                )}
              </form>
            ) : (
              <>
                {/* Store Selection */}
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2.5">เลือกร้านค้า</p>
                <div className="grid grid-cols-2 gap-2 mb-5">
                  {product.buyOptions.map((opt, i) => {
                    const active = selectedOption.store === opt.store;
                    return (
                      <button
                        key={opt.store}
                        onClick={() => setSelectedOption(opt)}
                        className={`flex items-center gap-3 p-3 rounded-2xl border-2 transition-all duration-200 cursor-pointer press-sm text-left animate-fadeUp
                          ${active ? 'border-primary-400 bg-primary-50 shadow-md scale-[1.02]' : 'border-gray-100 bg-gray-50 hover:border-gray-200 hover:shadow-sm'}`}
                        style={{ animationDelay: `${i * 50}ms` }}
                        aria-pressed={active}
                      >
                        <div className="transition-transform duration-200 hover:scale-110">
                          {STORE_SVG[opt.store] ?? (
                            <div className="w-7 h-7 rounded-lg bg-gray-200 flex items-center justify-center">
                              <span className="material-symbols-outlined text-gray-400 text-sm">store</span>
                            </div>
                          )}
                        </div>
                        <div className="flex-1">
                          <p className="font-bold text-sm text-gray-900 transition-colors duration-200">{opt.store}</p>
                          <p className="text-xs text-gray-400 transition-colors duration-200">{opt.price ? `฿${opt.price}` : 'ดูราคา'}</p>
                        </div>
                        {active && (
                          <span className="ml-auto material-symbols-outlined text-primary-500 text-sm animate-scaleIn">check_circle</span>
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Actions */}
                <div className="flex gap-3">
                  <button
                    onClick={handleAddToCart}
                    className="flex-1 btn-outline flex items-center justify-center gap-2"
                  >
                    <span className="material-symbols-outlined text-sm">shopping_cart</span>
                    ใส่ตะกร้า
                  </button>
                  <button
                    onClick={handleBuyNow}
                    className="flex-1 btn-primary flex items-center justify-center gap-2"
                  >
                    <span className="material-symbols-outlined text-sm">open_in_new</span>
                    ซื้อเลย
                  </button>
                </div>

                {/* Report Price Link */}
                <div className="mt-5 pt-4 border-t border-gray-100 flex items-center justify-between animate-fadeIn">
                  <span className="text-xs text-gray-500">เห็นสินค้านี้ลดราคาหน้าร้าน?</span>
                  <button
                    onClick={() => setShowReportForm(true)}
                    className="text-xs font-bold text-primary-600 hover:text-primary-700 underline focus:outline-none"
                  >
                    รายงานราคา
                  </button>
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
