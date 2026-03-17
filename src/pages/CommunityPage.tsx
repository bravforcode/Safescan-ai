import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { gradeColorClasses } from '../lib/utils';
import {
  safescanSelect, safescanInsert, safescanDelete, safescanRpc,
  type ProductReviewRow,
} from '../lib/supabase';

// ── Types ─────────────────────────────────────────────────────────────────────
interface ReviewWithMeta extends ProductReviewRow {
  user_name:   string | null;
  user_avatar: string | null;
  liked_by_me: boolean;
}

interface TrendingProduct {
  barcode:      string;
  product_name: string | null;
  product_brand:string | null;
  product_image:string | null;
  safety_grade: string | null;
  scan_count:   number;
}

// ── Review submission modal ───────────────────────────────────────────────────
function WriteReviewModal({
  onClose,
  onSubmit,
}: {
  onClose: () => void;
  onSubmit: (barcode: string, rating: number, tasteRating: number | null, text: string) => Promise<void>;
}) {
  const [barcode,     setBarcode]     = useState('');
  const [rating,      setRating]      = useState(0);
  const [tasteRating, setTasteRating] = useState(0);
  const [text,        setText]        = useState('');
  const [submitting,  setSubmitting]  = useState(false);
  const [error,       setError]       = useState('');

  const handleSubmit = async () => {
    if (!barcode.trim()) { setError('กรุณากรอกบาร์โค้ดสินค้า'); return; }
    if (rating === 0)    { setError('กรุณาให้คะแนนสินค้า'); return; }
    if (text.trim().length < 10) { setError('รีวิวต้องมีอย่างน้อย 10 ตัวอักษร'); return; }
    setSubmitting(true);
    setError('');
    try {
      await onSubmit(barcode.trim(), rating, tasteRating || null, text.trim());
      onClose();
    } catch {
      setError('เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/60 backdrop-blur-sm px-0 md:px-4">
      <div className="bg-white rounded-t-3xl md:rounded-3xl w-full md:max-w-lg p-6 shadow-2xl animate-scaleIn pb-safe-bottom">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-bold text-gray-900">เขียนรีวิวสินค้า</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
            <span className="material-symbols-outlined text-gray-500 text-lg">close</span>
          </button>
        </div>

        <div className="space-y-4">
          {/* Barcode */}
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">บาร์โค้ดสินค้า</label>
            <input
              value={barcode}
              onChange={e => setBarcode(e.target.value.replace(/\D/g, '').slice(0, 14))}
              placeholder="เช่น 8850987123456"
              className="mt-1 w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-300 focus:border-primary-400"
              inputMode="numeric"
            />
          </div>

          {/* Safety rating */}
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">คะแนนความปลอดภัย</label>
            <div className="flex gap-2 mt-2">
              {[1,2,3,4,5].map(s => (
                <button
                  key={s}
                  onClick={() => setRating(s)}
                  className={`flex-1 py-2 rounded-xl text-lg font-bold border-2 transition-all ${
                    s <= rating ? 'border-primary-400 bg-primary-50 text-primary-600' : 'border-gray-100 text-gray-300'
                  }`}
                >
                  ★
                </button>
              ))}
            </div>
          </div>

          {/* Taste rating */}
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">คะแนนรสชาติ (ไม่บังคับ)</label>
            <div className="flex gap-2 mt-2">
              {[1,2,3,4,5].map(s => (
                <button
                  key={s}
                  onClick={() => setTasteRating(prev => prev === s ? 0 : s)}
                  className={`flex-1 py-2 rounded-xl text-lg font-bold border-2 transition-all ${
                    s <= tasteRating ? 'border-orange-300 bg-orange-50 text-orange-500' : 'border-gray-100 text-gray-300'
                  }`}
                >
                  ♥
                </button>
              ))}
            </div>
          </div>

          {/* Review text */}
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">รีวิว (อย่างน้อย 10 ตัวอักษร)</label>
            <textarea
              value={text}
              onChange={e => setText(e.target.value.slice(0, 500))}
              placeholder="แบ่งปันประสบการณ์ของคุณ..."
              rows={3}
              className="mt-1 w-full border border-gray-200 rounded-xl px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary-300 focus:border-primary-400"
            />
            <p className="text-right text-[10px] text-gray-400 mt-0.5">{text.length}/500</p>
          </div>

          {error && <p className="text-xs text-red-500 font-medium">{error}</p>}

          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="w-full btn-primary py-3.5 rounded-2xl font-bold disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {submitting ? 'กำลังส่ง...' : 'ส่งรีวิว'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Star display ──────────────────────────────────────────────────────────────
function Stars({ rating }: { rating: number }) {
  return (
    <div className="flex bg-yellow-50 px-2 py-1 rounded-full border border-yellow-100">
      {[1,2,3,4,5].map(s => (
        <span key={s} className={`text-sm ${s <= rating ? 'text-yellow-400' : 'text-gray-200'}`}>★</span>
      ))}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export function CommunityPage() {
  const navigate = useNavigate();
  const { user, profile } = useAuth();

  const [activeTab,    setActiveTab]    = useState<'trending' | 'reviews'>('trending');
  const [reviews,      setReviews]      = useState<ReviewWithMeta[]>([]);
  const [trending,     setTrending]     = useState<TrendingProduct[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [showModal,    setShowModal]    = useState(false);

  // ── Fetch trending ──────────────────────────────────────────────────────────
  const fetchTrending = useCallback(async () => {
    const data = await safescanRpc<TrendingProduct[]>('get_trending_products', { p_limit: 10 });
    setTrending(data ?? []);
  }, []);

  // ── Fetch reviews ───────────────────────────────────────────────────────────
  const fetchReviews = useCallback(async () => {
    const raw = await safescanSelect<ProductReviewRow & { user_name: string | null; user_avatar: string | null }>(
      'product_reviews', '*', undefined,
      { column: 'created_at', ascending: false }, 30
    );
    if (!raw) { setReviews([]); return; }

    // Mark reviews liked by the current user
    let likedIds = new Set<string>();
    if (user) {
      const likes = await safescanSelect<{ review_id: string }>(
        'review_likes', 'review_id', { user_id: user.id }
      );
      likedIds = new Set((likes ?? []).map(l => l.review_id));
    }

    setReviews(raw.map(r => ({ ...r, liked_by_me: likedIds.has(r.id) })));
  }, [user]);

  useEffect(() => {
    (async () => {
      setLoading(true);
      await Promise.all([fetchTrending(), fetchReviews()]);
      setLoading(false);
    })();
  }, [fetchTrending, fetchReviews]);

  // ── Like / unlike ───────────────────────────────────────────────────────────
  const toggleLike = async (review: ReviewWithMeta) => {
    if (!user) { navigate('/login'); return; }

    if (review.liked_by_me) {
      await safescanDelete('review_likes', { user_id: user.id, review_id: review.id });
      setReviews(prev => prev.map(r =>
        r.id === review.id ? { ...r, liked_by_me: false, likes: Math.max(0, r.likes - 1) } : r
      ));
    } else {
      await safescanInsert('review_likes', { user_id: user.id, review_id: review.id });
      setReviews(prev => prev.map(r =>
        r.id === review.id ? { ...r, liked_by_me: true, likes: r.likes + 1 } : r
      ));
    }
  };

  // ── Submit review ───────────────────────────────────────────────────────────
  const submitReview = async (
    barcode: string, rating: number,
    tasteRating: number | null, text: string
  ) => {
    if (!user) throw new Error('not logged in');
    const row = {
      user_id:      user.id,
      user_name:    profile?.display_name ?? 'ผู้ใช้ SafeScan',
      user_avatar:  profile?.avatar_url   ?? null,
      barcode,
      rating,
      taste_rating: tasteRating,
      review_text:  text,
      likes:        0,
    };
    const data = await safescanInsert('product_reviews', row);
    if (!data) throw new Error('insert failed');
    setReviews(prev => [{ ...(data as ProductReviewRow & { user_name: string | null; user_avatar: string | null }), liked_by_me: false }, ...prev]);
  };

  // ── Time format ─────────────────────────────────────────────────────────────
  const timeAgo = (iso: string) => {
    const diff = (Date.now() - new Date(iso).getTime()) / 1000;
    if (diff < 60)   return 'เพิ่งโพสต์';
    if (diff < 3600) return `${Math.floor(diff / 60)} นาทีที่แล้ว`;
    if (diff < 86400)return `${Math.floor(diff / 3600)} ชั่วโมงที่แล้ว`;
    return `${Math.floor(diff / 86400)} วันที่แล้ว`;
  };

  return (
    <div className="flex flex-col pb-28 md:pb-8 min-h-screen animate-fadeIn">
      {/* Header */}
      <header className="glassmorphism sticky top-0 z-40 px-5 md:px-8 pt-10 md:pt-8 pb-4 border-b border-primary-50 md:border-none animate-slideDown">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary-600 to-indigo-600">คอมมูนิตี้</h1>
            <p className="text-sm text-gray-500 mt-0.5 font-medium">สำรวจเทรนด์สุขภาพและรีวิวจากผู้ใช้จริง</p>
          </div>
          {user && (
            <button
              onClick={() => setShowModal(true)}
              className="btn-primary py-2 px-4 text-sm flex items-center gap-1.5"
            >
              <span className="material-symbols-outlined text-base">edit</span>
              เขียนรีวิว
            </button>
          )}
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mt-5 p-1 bg-gray-100/80 backdrop-blur-md rounded-2xl w-full max-w-sm mx-auto md:mx-0">
          {(['trending', 'reviews'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 ${
                activeTab === tab ? 'bg-white text-primary-600 shadow-sm' : 'text-gray-500 hover:text-gray-700 hover:bg-white/50'
              }`}
            >
              {tab === 'trending' ? '🔥 กำลังมาแรง' : '💬 รีวิวล่าสุด'}
            </button>
          ))}
        </div>
      </header>

      <div className="px-5 md:px-8 pt-6">
        {loading ? (
          <div className="space-y-4">
            {[1,2,3].map(i => (
              <div key={i} className="card p-5 animate-pulse">
                <div className="flex gap-4">
                  <div className="w-16 h-16 bg-gray-100 rounded-2xl" />
                  <div className="flex-1 space-y-2 py-1">
                    <div className="h-4 bg-gray-100 rounded w-3/4" />
                    <div className="h-3 bg-gray-100 rounded w-1/2" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : activeTab === 'trending' ? (
          <div className="space-y-4 animate-fadeUp">
            <div className="bg-gradient-to-r from-orange-50 to-rose-50 border border-orange-100 rounded-2xl p-4 flex items-center gap-3 shadow-sm">
              <span className="material-symbols-outlined text-orange-500 text-3xl animate-pulse">local_fire_department</span>
              <div>
                <h3 className="font-bold text-gray-800 text-sm">สินค้าฮิตประจำสัปดาห์</h3>
                <p className="text-xs text-gray-500 mt-0.5">ถูกสแกนมากที่สุดใน 7 วันที่ผ่านมา</p>
              </div>
            </div>

            {trending.length === 0 ? (
              <div className="text-center py-16 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                <span className="material-symbols-outlined text-gray-200 text-5xl block mb-3">trending_up</span>
                <p className="text-sm font-medium text-gray-500">ยังไม่มีข้อมูลเทรนด์</p>
                <p className="text-xs text-gray-400 mt-1">เริ่มสแกนสินค้าเพื่อดูสินค้ายอดนิยม</p>
                <button onClick={() => navigate('/scan')} className="mt-4 btn-primary py-2 px-5 text-sm">สแกนสินค้า</button>
              </div>
            ) : (
              trending.map((item, index) => (
                <button
                  key={item.barcode}
                  onClick={() => navigate(`/product/${item.barcode}`)}
                  className="w-full card p-4 flex items-center gap-4 hover:border-primary-200 hover:shadow-md transition-all press-effect text-left group bg-white"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div className="relative font-black text-2xl text-gray-200 italic w-6 text-center">
                    #{index + 1}
                  </div>
                  {item.product_image ? (
                    <img
                      src={item.product_image}
                      alt={item.product_name ?? ''}
                      className="w-16 h-16 object-contain rounded-xl bg-gray-50 p-1 group-hover:scale-105 transition-transform"
                      onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-xl bg-gray-100 flex items-center justify-center flex-shrink-0">
                      <span className="material-symbols-outlined text-gray-300">inventory_2</span>
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-400 truncate font-medium">{item.product_brand ?? '—'}</p>
                    <p className="font-bold text-gray-900 text-sm truncate group-hover:text-primary-600 transition-colors">
                      {item.product_name ?? item.barcode}
                    </p>
                    <div className="flex items-center gap-2 mt-1.5">
                      <span className="flex items-center gap-1 text-[10px] font-bold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                        <span className="material-symbols-outlined text-[12px]">visibility</span>
                        {item.scan_count.toLocaleString()} สแกน
                      </span>
                    </div>
                  </div>
                  {item.safety_grade && (
                    <div className={`w-10 h-10 rounded-full flex justify-center items-center font-black flex-shrink-0 text-sm border-2 ${gradeColorClasses(item.safety_grade)}`}>
                      {item.safety_grade}
                    </div>
                  )}
                </button>
              ))
            )}
          </div>
        ) : (
          <div className="space-y-4 animate-fadeUp">
            {!user && (
              <div className="bg-primary-50 border border-primary-100 rounded-2xl p-5 text-center mb-2">
                <span className="material-symbols-outlined text-primary-400 text-3xl mb-2">lock_open</span>
                <p className="text-sm text-gray-700 font-medium mb-3">เข้าสู่ระบบเพื่อเขียนรีวิวสินค้า แบ่งปันประสบการณ์ของคุณ!</p>
                <button onClick={() => navigate('/login')} className="btn-primary py-2 px-6 text-xs uppercase tracking-wider">เข้าสู่ระบบ</button>
              </div>
            )}

            {reviews.length === 0 ? (
              <div className="text-center py-16 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                <span className="material-symbols-outlined text-gray-200 text-5xl block mb-3">rate_review</span>
                <p className="text-sm font-medium text-gray-500">ยังไม่มีรีวิว</p>
                <p className="text-xs text-gray-400 mt-1">เป็นคนแรกที่รีวิวสินค้า!</p>
                {user && (
                  <button onClick={() => setShowModal(true)} className="mt-4 btn-primary py-2 px-5 text-sm">เขียนรีวิว</button>
                )}
              </div>
            ) : (
              reviews.map(review => (
                <div key={review.id} className="card p-5 hover:shadow-md transition-shadow bg-white">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center overflow-hidden border-2 border-white shadow-sm">
                        {review.user_avatar ? (
                          <img src={review.user_avatar} alt={review.user_name ?? ''} className="w-full h-full object-cover" />
                        ) : (
                          <span className="material-symbols-outlined text-primary-400 text-xl">person</span>
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-gray-900">{review.user_name ?? 'ผู้ใช้ SafeScan'}</p>
                        <p className="text-[10px] text-gray-400">{timeAgo(review.created_at)}</p>
                      </div>
                    </div>
                    <Stars rating={review.rating} />
                  </div>

                  <button
                    className="bg-gray-50 rounded-xl p-3 mb-3 flex items-center gap-3 w-full hover:bg-gray-100 transition-colors text-left"
                    onClick={() => navigate(`/product/${review.barcode}`)}
                  >
                    <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-sm border border-gray-100 flex-shrink-0">
                      {review.product_image ? (
                        <img src={review.product_image} alt="" className="w-full h-full object-contain rounded-lg" />
                      ) : (
                        <span className="material-symbols-outlined text-gray-300">inventory_2</span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] text-primary-500 font-bold tracking-wider uppercase">รีวิวสินค้า</p>
                      <p className="text-sm font-bold text-gray-800 truncate">{review.product_name ?? review.barcode}</p>
                    </div>
                    <span className="material-symbols-outlined text-gray-400 text-sm">chevron_right</span>
                  </button>

                  {review.review_text && (
                    <p className="text-sm text-gray-700 leading-relaxed">{review.review_text}</p>
                  )}

                  <div className="flex items-center gap-4 mt-4 pt-4 border-t border-gray-50">
                    <button
                      onClick={() => toggleLike(review)}
                      className={`flex items-center gap-1.5 text-xs font-semibold transition-colors flex-1 justify-center ${
                        review.liked_by_me ? 'text-primary-500' : 'text-gray-400 hover:text-primary-500'
                      }`}
                    >
                      <span className="material-symbols-outlined text-base">
                        {review.liked_by_me ? 'thumb_up' : 'thumb_up'}
                      </span>
                      มีประโยชน์ ({review.likes})
                    </button>
                    <button
                      onClick={() => navigate(`/product/${review.barcode}`)}
                      className="flex items-center gap-1.5 text-xs font-semibold text-gray-400 hover:text-primary-500 transition-colors flex-1 justify-center border-l border-gray-100"
                    >
                      <span className="material-symbols-outlined text-base">open_in_new</span>
                      ดูสินค้า
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {showModal && (
        <WriteReviewModal
          onClose={() => setShowModal(false)}
          onSubmit={submitReview}
        />
      )}
    </div>
  );
}
