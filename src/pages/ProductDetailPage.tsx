import { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate, Link } from 'react-router-dom';
import type { Product, IngredientStatus, Additive } from '../types';
import { SafetyScoreGauge } from '../components/SafetyBadge';
import { BuyModal } from '../components/BuyModal';
import { AllergenAlert } from '../components/AllergenAlert';
import { NovaCard, EcoCard, NutriScoreBadge } from '../components/NovaEcoCard';
import { ProductLabels, AllergenChips, DataSourceBadge } from '../components/ProductLabels';
import { SafetyScoreBreakdown } from '../components/SafetyScoreBreakdown';
import { useScanHistory } from '../hooks/useScanHistory';
import { useFavorites } from '../hooks/useFavorites';
import { useAlternatives } from '../hooks/useAlternatives';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { fetchAndParseProduct } from '../hooks/useProductLookup';
import { DAILY_VALUES } from '../lib/ingredientDatabase';
import { detectInteractions } from '../lib/additiveInteractions';
import { getGradeConfig, timeAgo } from '../lib/utils';
import { safescanSelect, safescanInsert, type ProductReviewRow } from '../lib/supabase';
import type { AdditiveInteraction } from '../lib/additiveInteractions';

// ── Constants ────────────────────────────────────────────────────────────────
const STATUS_CONFIG: Record<IngredientStatus, {
  bg: string; text: string; border: string; label: string; icon: string; dotColor: string;
}> = {
  safe:    { bg: 'bg-green-50',  text: 'text-green-700',  border: 'border-green-200',  label: 'ปลอดภัย',     icon: 'check_circle', dotColor: 'bg-green-500' },
  caution: { bg: 'bg-yellow-50', text: 'text-yellow-700', border: 'border-yellow-200', label: 'ควรระวัง',    icon: 'warning',      dotColor: 'bg-yellow-400' },
  risk:    { bg: 'bg-red-50',    text: 'text-red-700',    border: 'border-red-200',    label: 'มีความเสี่ยง', icon: 'dangerous',    dotColor: 'bg-red-500' },
};

const ADDITIVE_SEVERITY: Record<Additive['severity'], { bg: string; text: string; border: string; label: string }> = {
  safe:    { bg: 'bg-green-50',  text: 'text-green-700',  border: 'border-green-200',  label: 'ปลอดภัย'     },
  caution: { bg: 'bg-yellow-50', text: 'text-yellow-700', border: 'border-yellow-200', label: 'ควรระวัง'    },
  risk:    { bg: 'bg-red-50',    text: 'text-red-700',    border: 'border-red-200',    label: 'มีความเสี่ยง' },
};

// ── Sub-components ────────────────────────────────────────────────────────────
function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between py-3 border-b border-gray-50 last:border-0">
      <span className="text-sm text-gray-500 flex-shrink-0 mr-3">{label}</span>
      <span className="text-sm font-semibold text-gray-800 text-right max-w-[62%] leading-snug">{value || '—'}</span>
    </div>
  );
}

function SectionTitle({ icon, children, color = 'text-primary-500' }: {
  icon: string; children: React.ReactNode; color?: string;
}) {
  return (
    <h2 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
      <span className={`material-symbols-outlined text-lg ${color}`} aria-hidden="true">{icon}</span>
      <span>{children}</span>
    </h2>
  );
}

/** Animated progress bar used inside NutritionBarDV */
function ProgressBar({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = Math.min((value / max) * 100, 100);
  const [width, setWidth] = useState(0);
  useEffect(() => { const t = setTimeout(() => setWidth(pct), 120); return () => clearTimeout(t); }, [pct]);
  return (
    <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
      <div className={`h-full rounded-full ${color}`} style={{ width: `${width}%`, transition: 'width 0.9s cubic-bezier(0.22,1,0.36,1)' }} />
    </div>
  );
}

/** Nutrition bar with optional %DV indicator */
function NutritionBarDV({
  label, value, unit, max, color, dvKey, icon, delay = 0, servingMultiplier = 1,
}: {
  label: string; value: number; unit: string; max: number;
  color: string; dvKey?: keyof typeof DAILY_VALUES; icon?: string; delay?: number; servingMultiplier?: number;
}) {
  const scaledMax = max * servingMultiplier;
  const dvValue = dvKey ? DAILY_VALUES[dvKey] : undefined;
  const dvPercent = dvValue && dvValue > 0
    ? unit === 'mg' && dvKey && DAILY_VALUES[dvKey] > 1000
      ? Math.round((value / (DAILY_VALUES[dvKey] as number)) * 100)
      : Math.round(((unit === 'mg' ? value : value) / (dvValue as number)) * 100)
    : undefined;

  return (
    <div style={{ animationDelay: `${delay}ms` }} className="animate-fadeUp">
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-1.5">
          {icon && <span className="material-symbols-outlined text-sm text-gray-400">{icon}</span>}
          <span className="text-sm font-medium text-gray-700">{label}</span>
        </div>
        <div className="flex items-center gap-2">
          {dvPercent !== undefined && (
            <span className={`text-xs font-semibold px-1.5 py-0.5 rounded-full ${
              dvPercent > 20 ? 'bg-orange-100 text-orange-700' : 'bg-gray-100 text-gray-500'
            }`}>
              {dvPercent}% DV
            </span>
          )}
          <span className="text-sm font-bold text-gray-900 tabular-nums">
            {value % 1 === 0 ? value.toFixed(0) : value.toFixed(1)}{unit}
          </span>
        </div>
      </div>
      <ProgressBar value={value} max={scaledMax} color={color} />
    </div>
  );
}

/** Grade badge circle */
function GradeBadge({ grade, size = 'md' }: { grade: Product['grade']; size?: 'sm' | 'md' | 'lg' }) {
  const sizeClass = size === 'lg' ? 'w-10 h-10 text-lg' : size === 'sm' ? 'w-6 h-6 text-xs' : 'w-8 h-8 text-sm';
  const bgMap: Record<Product['grade'], string> = {
    A: 'bg-green-100 border-green-300', B: 'bg-lime-100 border-lime-300',
    C: 'bg-yellow-100 border-yellow-300', D: 'bg-orange-100 border-orange-300',
    E: 'bg-red-100 border-red-300',
  };
  return (
    <div className={`${sizeClass} rounded-full border-2 flex items-center justify-center font-black flex-shrink-0 ${bgMap[grade]} ${getGradeConfig(grade).text}`}>
      {grade}
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export function ProductDetailPage() {
  const { barcode }  = useParams();
  const location     = useLocation();
  const navigate     = useNavigate();
  const { user }     = useAuth();
  const { addScan }  = useScanHistory();
  const { isFavorite, toggleFavorite } = useFavorites();
  const { alternatives, loading: altLoading, fetchAlternatives } = useAlternatives();

  const [showBuyModal,       setShowBuyModal]       = useState(false);
  const [openIngredient,     setOpenIngredient]     = useState<number | null>(null);
  const [openAdditive,       setOpenAdditive]       = useState<number | null>(null);
  const [favLoading,         setFavLoading]         = useState(false);
  const [activeImageIdx,     setActiveImageIdx]     = useState(0);
  const [activeTab,          setActiveTab]          = useState<'nutrition' | 'ingredients' | 'additives' | 'info' | 'reviews'>('nutrition');
  const [showAllIngredients, setShowAllIngredients] = useState(false);
  const [showAllAdditives,   setShowAllAdditives]   = useState(false);
  const [perServing,         setPerServing]         = useState(false);
  const [showScoreBreakdown, setShowScoreBreakdown] = useState(false);
  const [showRawIngText,     setShowRawIngText]     = useState(false);
  const [shareToast,         setShareToast]         = useState(false);
  const [logToast,           setLogToast]           = useState(false);
  const [logLoading,         setLogLoading]         = useState(false);
  const [fetched,            setFetched]            = useState<Product | null>(null);
  const [fetchLoading,       setFetchLoading]       = useState(false);

  // Reviews state
  const { showToast } = useToast();
  const [reviewText, setReviewText] = useState('');
  const [rating, setRating] = useState(0);
  const [submittingReview, setSubmittingReview] = useState(false);
  const [productReviews, setProductReviews] = useState<(ProductReviewRow & { profiles?: { display_name: string, avatar_url: string } })[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);

  const product = (location.state?.product ?? fetched) as Product | undefined;

  // Fallback fetch if direct URL navigation (no location.state.product)
  useEffect(() => {
    if (location.state?.product || !barcode) return;
    setFetchLoading(true);
    fetchAndParseProduct(barcode).then(p => {
      setFetched(p);
      setFetchLoading(false);
    });
  }, [barcode, location.state?.product]);

  // Fetch reviews logic
  useEffect(() => {
    let mounted = true;
    if (barcode) {
      setReviewsLoading(true);
      safescanSelect<any>('product_reviews', '*, profiles(display_name, avatar_url)', { barcode })
        .then(data => {
          if (mounted && Array.isArray(data)) {
            // Sort by most recent first
            data.sort((a: any, b: any) =>
              new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
            );
            setProductReviews(data);
          } else if (mounted) {
            setProductReviews([]);
          }
        })
        .catch(err => {
          // Handle cases where query fails gracefully
          if (mounted) {
            console.warn('Failed to load reviews:', err);
            setProductReviews([]);
          }
        })
        .finally(() => {
          if (mounted) setReviewsLoading(false);
        });
    }
    return () => { mounted = false; };
  }, [barcode]);

  const handleSubmitReview = async () => {
    if (!user) {
      showToast('กรุณาเข้าสู่ระบบเพื่อเขียนรีวิว', 'error');
      navigate('/login');
      return;
    }
    if (rating === 0) {
      showToast('กรุณาให้คะแนนดาว', 'error');
      return;
    }
    if (!reviewText.trim()) {
      showToast('กรุณาเขียนความคิดเห็น', 'error');
      return;
    }
    if (!barcode) return;

    setSubmittingReview(true);
    try {
      const newReview = await safescanInsert<ProductReviewRow>('product_reviews', {
        id: crypto.randomUUID(),
        user_id: user.id,
        user_name: user.user_metadata?.full_name || null,
        user_avatar: user.user_metadata?.avatar_url || null,
        barcode: barcode,
        product_name: product?.name || null,
        product_brand: product?.brand || null,
        product_image: product?.image || null,
        rating: rating,
        taste_rating: null,
        review_text: reviewText.trim(),
        likes: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });

      if (newReview) {
        showToast('ส่งรีวิวเรียบร้อยแล้ว ขอบคุณที่แบ่งปัน', 'success');
        setReviewText('');
        setRating(0);
        
        // Optimistic UI update
        const profileData = user.user_metadata ? { display_name: user.user_metadata.full_name || 'ผู้ใช้งาน', avatar_url: user.user_metadata.avatar_url || '' } : { display_name: 'ผู้ใช้งาน', avatar_url: '' };
        setProductReviews(prev => [{...newReview, profiles: profileData}, ...prev]);
        
        // Push social feed asynchronously without blocking
        safescanInsert('social_feed', {
           id: crypto.randomUUID(),
           user_id: user.id,
           action_type: 'reviewed',
           product_barcode: barcode,
           content: `ให้คะแนน ${rating} ดาว: ${reviewText.trim().substring(0, 50)}...`,
           created_at: new Date().toISOString()
        }).catch(() => {});
      } else {
        showToast('ไม่สามารถส่งรีวิวได้ กรุณาลองใหม่', 'error');
      }
    } catch (e) {
      showToast('เกิดข้อผิดพลาด กรุณาลองใหม่', 'error');
    } finally {
      setSubmittingReview(false);
    }
  };

  // Auto-save scan to history
  useEffect(() => {
    if (product && user) addScan(product);
  }, [product?.barcode, user?.id]);

  // Fetch alternatives after product loads
  useEffect(() => {
    if (product) fetchAlternatives(product);
  }, [product?.barcode]);

  const handleFavorite = async () => {
    if (!product) return;
    setFavLoading(true);
    await toggleFavorite(product);
    setFavLoading(false);
  };

  const handleLogConsumption = async () => {
    if (!product || !user) {
      if (!user) navigate('/login');
      return;
    }
    setLogLoading(true);
    try {
      const ok = await safescanInsert('consumption_logs', {
        user_id:       user.id,
        barcode:       product.barcode,
        product_name:  product.name,
        product_image: product.image ?? null,
        servings:      1,
        calories:      product.nutrition.calories || null,
        protein:       product.nutrition.protein  || null,
        fat:           product.nutrition.fat       || null,
        carbs:         product.nutrition.carbs     || null,
        sugar:         product.nutrition.sugar     || null,
        sodium:        product.nutrition.sodium    || null,
        fiber:         product.nutrition.fiber     || null,
      });
      if (!ok) throw new Error('insert failed');

      setLogToast(true);
      setTimeout(() => setLogToast(false), 3000);
    } catch (err) {
      console.error('Error logging consumption:', err);
      alert('เกิดข้อผิดพลาดในการบันทึกข้อมูล');
    } finally {
      setLogLoading(false);
    }
  };

  const handleShare = async () => {
    if (!product) return;
    const text = `${product.name} — เกรด ${product.grade} (${product.safetyScore}/100) | SafeScan AI`;
    if (navigator.share) {
      try { await navigator.share({ title: 'SafeScan AI', text, url: window.location.href }); }
      catch { /* user cancelled */ }
    } else {
      try {
        await navigator.clipboard.writeText(text + '\n' + window.location.href);
        setShareToast(true);
        setTimeout(() => setShareToast(false), 2500);
      } catch {
        // Fallback for browsers without clipboard API or when not HTTPS
        const el = document.createElement('textarea');
        el.value = text + '\n' + window.location.href;
        document.body.appendChild(el);
        el.select();
        document.execCommand('copy');
        document.body.removeChild(el);
        setShareToast(true);
        setTimeout(() => setShareToast(false), 2500);
      }
    }
  };

  if (!product) {
    if (fetchLoading) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[70vh] px-6 text-center pb-24">
          <div className="w-20 h-20 rounded-3xl bg-gray-100 flex items-center justify-center mb-4 animate-pulse">
            <span className="material-symbols-outlined text-gray-300 text-4xl">inventory_2</span>
          </div>
          <p className="text-sm text-gray-400">กำลังโหลดข้อมูลสินค้า...</p>
        </div>
      );
    }
    // This should never be reached now (fetchAndParseProduct always returns a stub)
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] px-6 text-center pb-24 animate-fadeUp">
        <span className="material-symbols-outlined text-gray-200 text-6xl mb-4">inventory_2</span>
        <h2 className="text-xl font-bold text-gray-700 mb-1">ไม่พบข้อมูลสินค้า</h2>
        <p className="text-sm text-gray-400 mb-6">บาร์โค้ด: {barcode}</p>
        <button onClick={() => navigate('/scan')} className="btn-primary">กลับไปสแกน</button>
      </div>
    );
  }

  const isUnknownProduct = product.dataComplete === false;

  // ── Unknown product — not found in any database ─────────────────────────────
  if (isUnknownProduct) {
    return (
      <div className="flex flex-col pb-28 md:pb-8 animate-fadeUp">
        <header className="glassmorphism sticky top-0 z-40 px-5 md:px-8 pt-10 md:pt-5 pb-4 border-b border-primary-50 animate-slideDown">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-full bg-white border border-gray-100 shadow-sm flex items-center justify-center flex-shrink-0 press-effect">
              <span className="material-symbols-outlined text-gray-700 text-xl">arrow_back</span>
            </button>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-gray-400 truncate">บาร์โค้ด: {barcode}</p>
              <p className="font-bold text-gray-900 text-sm truncate">ไม่พบข้อมูลสินค้า</p>
            </div>
          </div>
        </header>

        <div className="px-5 md:px-8 pt-6 space-y-5">
          {/* Unknown banner */}
          <div className="card p-8 text-center">
            <div className="w-20 h-20 rounded-3xl bg-gray-100 flex items-center justify-center mx-auto mb-5">
              <span className="material-symbols-outlined text-gray-300 text-4xl">inventory_2</span>
            </div>
            <h2 className="text-xl font-bold text-gray-800 mb-2">ไม่พบข้อมูลสินค้านี้</h2>
            <p className="text-sm text-gray-500 mb-1">ไม่พบในฐานข้อมูล Open Food Facts, Open Beauty Facts<br/>และ Open Pet Food Facts</p>
            <p className="text-xs text-gray-400 mb-6">บาร์โค้ด: <span className="font-mono font-bold text-gray-600">{barcode}</span></p>

            {/* Barcode info from GS1 analysis */}
            {product.barcodeCountry && (
              <div className="inline-flex items-center gap-2 bg-primary-50 px-4 py-2 rounded-full mb-6">
                <span className="material-symbols-outlined text-primary-400 text-sm">public</span>
                <span className="text-sm text-primary-700 font-semibold">ประเทศ: {product.barcodeCountry}</span>
              </div>
            )}

            <div className="flex flex-col gap-3">
              <a
                href={`https://world.openfoodfacts.org/product/${barcode}`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-primary flex items-center justify-center gap-2 py-3"
              >
                <span className="material-symbols-outlined text-base">add_circle</span>
                เพิ่มสินค้านี้ใน Open Food Facts
              </a>
              <button
                onClick={() => navigate('/scan')}
                className="py-3 rounded-2xl border border-gray-200 text-gray-600 font-semibold text-sm hover:bg-gray-50 transition-colors"
              >
                สแกนสินค้าใหม่
              </button>
            </div>
          </div>

          {/* Still show buy options */}
          <div className="card p-5">
            <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary-500 text-lg">shopping_cart</span>
              ค้นหาซื้อสินค้านี้
            </h3>
            <div className="grid grid-cols-2 gap-2">
              {product.buyOptions.map(opt => (
                <a
                  key={opt.store}
                  href={opt.searchUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 p-3 rounded-xl border border-gray-100 hover:border-primary-200 hover:bg-primary-50 transition-colors text-sm font-semibold text-gray-700 press-sm"
                >
                  <span className="material-symbols-outlined text-base" style={{ color: opt.color }}>storefront</span>
                  {opt.store}
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  const { ingredients, additives = [] } = product;

  // Serving multiplier — toggle between per 100g and per serving
  const servingWeight   = product.servingWeight ?? product.nutrition.servingWeight;
  const servingMultiplier = perServing && servingWeight ? servingWeight / 100 : 1;
  const nutrition       = Object.fromEntries(
    Object.entries(product.nutrition).map(([k, v]) =>
      typeof v === 'number' ? [k, v * servingMultiplier] : [k, v]
    )
  ) as typeof product.nutrition;

  const hasNutrition    = nutrition.calories > 0 || nutrition.protein > 0 || nutrition.fat > 0;
  const riskCount       = ingredients.filter(i => i.status === 'risk').length;
  const cautionCount    = ingredients.filter(i => i.status === 'caution').length;
  const riskAdditives   = additives.filter(a => a.severity === 'risk').length;
  const cautionAdditives= additives.filter(a => a.severity === 'caution').length;

  // Additive interaction warnings
  const interactions: AdditiveInteraction[] = detectInteractions(additives);

  // Images carousel
  const images     = product.images?.length ? product.images : product.image ? [product.image] : [];
  const displayImg = images[activeImageIdx] ?? '';

  // Vitamins/minerals to show
  const vitamins = [
    { key: 'vitaminA',   label: 'วิตามิน A',   unit: 'µg', dv: DAILY_VALUES.vitaminA,  max: 1000, color: 'bg-yellow-500', value: nutrition.vitaminA },
    { key: 'vitaminC',   label: 'วิตามิน C',   unit: 'mg', dv: DAILY_VALUES.vitaminC,  max: 150,  color: 'bg-orange-400', value: nutrition.vitaminC },
    { key: 'vitaminD',   label: 'วิตามิน D',   unit: 'µg', dv: DAILY_VALUES.vitaminD,  max: 40,   color: 'bg-yellow-400', value: nutrition.vitaminD },
    { key: 'vitaminE',   label: 'วิตามิน E',   unit: 'mg', dv: DAILY_VALUES.vitaminE,  max: 30,   color: 'bg-amber-500',  value: nutrition.vitaminE },
    { key: 'vitaminK',   label: 'วิตามิน K',   unit: 'µg', dv: DAILY_VALUES.vitaminK,  max: 200,  color: 'bg-green-600',  value: nutrition.vitaminK },
    { key: 'vitaminB1',  label: 'วิตามิน B1',  unit: 'mg', dv: DAILY_VALUES.vitaminB1, max: 2,    color: 'bg-blue-400',   value: nutrition.vitaminB1 },
    { key: 'vitaminB2',  label: 'วิตามิน B2',  unit: 'mg', dv: DAILY_VALUES.vitaminB2, max: 2,    color: 'bg-blue-500',   value: nutrition.vitaminB2 },
    { key: 'vitaminB3',  label: 'วิตามิน B3',  unit: 'mg', dv: DAILY_VALUES.vitaminB3, max: 25,   color: 'bg-indigo-400', value: nutrition.vitaminB3 },
    { key: 'vitaminB6',  label: 'วิตามิน B6',  unit: 'mg', dv: DAILY_VALUES.vitaminB6, max: 3,    color: 'bg-purple-400', value: nutrition.vitaminB6 },
    { key: 'vitaminB9',  label: 'โฟเลต (B9)',  unit: 'µg', dv: DAILY_VALUES.vitaminB9, max: 600,  color: 'bg-teal-500',   value: nutrition.vitaminB9 },
    { key: 'vitaminB12', label: 'วิตามิน B12', unit: 'µg', dv: DAILY_VALUES.vitaminB12,max: 5,    color: 'bg-cyan-500',   value: nutrition.vitaminB12 },
  ].filter(v => v.value !== undefined && v.value! > 0);

  const minerals = [
    { key: 'calcium',    label: 'แคลเซียม',  unit: 'mg', dv: DAILY_VALUES.calcium,    max: 1500, color: 'bg-blue-300',   value: nutrition.calcium },
    { key: 'iron',       label: 'ธาตุเหล็ก', unit: 'mg', dv: DAILY_VALUES.iron,       max: 25,   color: 'bg-red-400',    value: nutrition.iron },
    { key: 'potassium',  label: 'โพแทสเซียม',unit: 'mg', dv: DAILY_VALUES.potassium,  max: 5000, color: 'bg-orange-300', value: nutrition.potassium },
    { key: 'magnesium',  label: 'แมกนีเซียม', unit: 'mg', dv: DAILY_VALUES.magnesium,  max: 500,  color: 'bg-green-400',  value: nutrition.magnesium },
    { key: 'phosphorus', label: 'ฟอสฟอรัส',  unit: 'mg', dv: DAILY_VALUES.phosphorus, max: 1500, color: 'bg-lime-500',   value: nutrition.phosphorus },
    { key: 'zinc',       label: 'สังกะสี',   unit: 'mg', dv: DAILY_VALUES.zinc,       max: 15,   color: 'bg-purple-400', value: nutrition.zinc },
    { key: 'selenium',   label: 'ซีลีเนียม', unit: 'µg', dv: DAILY_VALUES.selenium,   max: 80,   color: 'bg-teal-400',   value: nutrition.selenium },
    { key: 'iodine',     label: 'ไอโอดีน',   unit: 'µg', dv: 150,                     max: 300,  color: 'bg-cyan-400',   value: nutrition.iodine },
  ].filter(m => m.value !== undefined && m.value! > 0);

  const visibleIngredients = showAllIngredients ? ingredients : ingredients.slice(0, 10);
  const visibleAdditives   = showAllAdditives   ? additives   : additives.slice(0, 8);

  return (
    <>
      {/* Allergen auto-modal */}
      <AllergenAlert product={product} />

      {/* Share toast */}
      {shareToast && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[9998] bg-gray-900 text-white text-sm font-semibold px-5 py-3 rounded-2xl shadow-xl animate-scaleIn flex items-center gap-2">
          <span className="material-symbols-outlined text-green-400 text-base">check_circle</span>
          คัดลอกลิงก์แล้ว
        </div>
      )}

      {/* Log Toast */}
      {logToast && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[9998] bg-gray-900 text-white text-sm font-semibold px-5 py-3 rounded-2xl shadow-xl animate-scaleIn flex items-center gap-2">
          <span className="material-symbols-outlined text-green-400 text-base">check_circle</span>
          บันทึกลงไดอารี่แล้ว
        </div>
      )}

      <div className="flex flex-col pb-28 md:pb-8">

        {/* ── Sticky Header ── */}
        <header className="glassmorphism sticky top-0 z-40 px-5 md:px-8 pt-10 md:pt-5 pb-4 border-b border-primary-50 animate-slideDown">
          <div className="flex items-center justify-between gap-3">
            <button
              onClick={() => navigate(-1)}
              aria-label="กลับ"
              className="w-10 h-10 rounded-full bg-white border border-gray-100 shadow-sm flex items-center justify-center flex-shrink-0 press-effect cursor-pointer focus-ring"
            >
              <span className="material-symbols-outlined text-gray-700 text-xl">arrow_back</span>
            </button>
            <div className="flex-1 min-w-0 text-center md:text-left">
              <p className="text-xs text-gray-400 truncate">{product.brand}</p>
              <p className="font-bold text-gray-900 text-sm truncate">{product.name}</p>
            </div>
            <div className="flex items-center gap-2">
              {user && (
                <button
                  onClick={handleFavorite}
                  disabled={favLoading}
                  aria-label="บันทึกรายการโปรด"
                  className={`w-10 h-10 rounded-full border flex items-center justify-center transition-all press-effect cursor-pointer ${
                    isFavorite(product.barcode)
                      ? 'bg-red-50 border-red-200 text-red-500'
                      : 'bg-white border-gray-100 text-gray-400 hover:text-red-400 hover:border-red-200'
                  }`}
                >
                  <span className="material-symbols-outlined text-xl">
                    {isFavorite(product.barcode) ? 'favorite' : 'favorite_border'}
                  </span>
                </button>
              )}
              <button
                onClick={handleShare}
                aria-label="แชร์"
                className="w-10 h-10 rounded-full bg-white border border-gray-100 shadow-sm flex items-center justify-center text-gray-400 hover:text-primary-500 hover:border-primary-200 transition-all press-effect cursor-pointer"
              >
                <span className="material-symbols-outlined text-xl">share</span>
              </button>
              <button
                onClick={() => setShowBuyModal(true)}
                className="btn-primary flex items-center gap-1.5 py-2.5 px-4 text-sm cursor-pointer"
              >
                <span className="material-symbols-outlined text-sm">shopping_cart</span>
                <span className="hidden sm:inline">ซื้อเลย</span>
              </button>
            </div>
          </div>
        </header>

        <div className="px-5 md:px-8 pt-6">
          <div className="md:grid md:grid-cols-2 md:gap-8 space-y-6 md:space-y-0">

            {/* ══ LEFT COLUMN ══ */}
            <div className="space-y-5">

              {/* Product Hero + Image Carousel */}
              <div className="card p-6 flex flex-col items-center text-center animate-fadeUp">
                {/* Image */}
                <div className="relative mb-4">
                  <div className="w-48 h-48 rounded-3xl bg-gray-50 flex items-center justify-center overflow-hidden border border-gray-100">
                    {displayImg ? (
                      <img
                        src={displayImg}
                        alt={product.name}
                        className="w-full h-full object-contain p-3"
                        loading="eager"
                      />
                    ) : (
                      <span className="material-symbols-outlined text-gray-200 text-7xl">inventory_2</span>
                    )}
                  </div>
                  {/* Rating badge */}
                  {product.rating && (
                    <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-1 bg-white border border-yellow-100 shadow-sm rounded-full px-3 py-1 whitespace-nowrap">
                      <span className="text-yellow-400 text-sm">★</span>
                      <span className="font-bold text-sm text-gray-800">{product.rating.toFixed(1)}</span>
                    </div>
                  )}
                </div>

                {/* Thumbnail strip */}
                {images.length > 1 && (
                  <div className="flex gap-2 mt-3 mb-2">
                    {images.map((img, i) => (
                      <button
                        key={i}
                        onClick={() => setActiveImageIdx(i)}
                        className={`w-12 h-12 rounded-xl overflow-hidden border-2 transition-all cursor-pointer ${
                          activeImageIdx === i ? 'border-primary-500 shadow-sm' : 'border-gray-100 opacity-60 hover:opacity-100'
                        }`}
                      >
                        <img src={img} alt="" className="w-full h-full object-contain" />
                      </button>
                    ))}
                  </div>
                )}

                <p className="text-sm text-gray-400 font-medium mt-2">{product.brand}</p>
                <h1 className="text-xl font-bold text-gray-900 mt-1 mb-2 leading-snug">{product.name}</h1>

                {/* Quantity / serving */}
                {(product.quantity || product.servingSize) && (
                  <p className="text-xs text-gray-400 mb-3">
                    {product.quantity && <span>{product.quantity}</span>}
                    {product.quantity && product.servingSize && <span> · </span>}
                    {product.servingSize && <span>1 serving = {product.servingSize}</span>}
                  </p>
                )}

                {/* Category chips */}
                {product.categories.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 justify-center mb-3">
                    {product.categories.slice(0, 4).map((cat, i) => (
                      <span key={i} className="chip bg-primary-50 text-primary-600 border-primary-100 text-xs">
                        {cat}
                      </span>
                    ))}
                  </div>
                )}

                {/* Health Goal Warnings */}
                {product.healthWarnings && product.healthWarnings.length > 0 && (
                  <div className="w-full mt-3 mb-2 bg-red-50 border border-red-200 rounded-2xl p-4 text-left animate-fadeUp">
                    <h3 className="text-red-800 font-bold mb-2 flex items-center gap-2 text-sm">
                      <span className="material-symbols-outlined text-red-500 text-base">warning</span>
                      ขัดต่อเป้าหมายสุขภาพ
                    </h3>
                    <ul className="list-disc list-inside text-xs text-red-700 space-y-1 pl-1">
                      {product.healthWarnings.map((warning, i) => (
                        <li key={i}>{warning}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Certification labels compact */}
                <ProductLabels product={product} compact />

                {/* Data source */}
                <div className="mt-3 w-full">
                  <DataSourceBadge source={product.dataSource} complete={product.dataComplete} />
                </div>

                {/* Log Consumption Button */}
                <button
                  onClick={handleLogConsumption}
                  disabled={logLoading}
                  className="w-full mt-4 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 hover:shadow-sm border border-indigo-100 transition-all flex items-center justify-center gap-2 py-3 rounded-2xl font-bold press-effect group"
                >
                  {logLoading ? (
                    <span className="w-5 h-5 border-2 border-indigo-300 border-t-indigo-600 rounded-full animate-spin"></span>
                  ) : (
                    <span className="material-symbols-outlined text-lg group-hover:scale-110 transition-transform">add_circle</span>
                  )}
                  เพิ่มลงไดอารี่วันนี้
                </button>
              </div>

              {/* Safety Score + Grade Scores Row */}
              <div className="card p-6 text-center animate-fadeUp delay-100">
                <div className="flex items-center justify-between mb-5">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">คะแนนความปลอดภัย</p>
                  <button
                    onClick={() => setShowScoreBreakdown(!showScoreBreakdown)}
                    className={`flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full border cursor-pointer transition-colors ${
                      showScoreBreakdown ? 'bg-primary-500 text-white border-primary-500' : 'bg-white text-primary-600 border-primary-300 hover:bg-primary-50'
                    }`}
                  >
                    <span className="material-symbols-outlined text-sm">analytics</span>
                    {showScoreBreakdown ? 'ซ่อน' : 'วิเคราะห์'}
                  </button>
                </div>
                <SafetyScoreGauge score={product.safetyScore} grade={product.grade} />

                {/* Score tiles */}
                <div className="grid grid-cols-3 gap-2 mt-5">
                  {product.nutriscoreScore !== undefined && (
                    <div className="bg-gray-50 rounded-2xl p-3 text-center">
                      <p className="text-xs text-gray-400 font-semibold mb-1">Nutri-score</p>
                      {(() => {
                        const grades = ['e','d','c','b','a'];
                        const g = grades[product.nutriscoreScore! - 1]?.toUpperCase() ?? '?';
                        const colors: Record<string, string> = {A:'text-green-600',B:'text-lime-600',C:'text-yellow-600',D:'text-orange-600',E:'text-red-600'};
                        return <p className={`text-xl font-black ${colors[g] ?? 'text-gray-600'}`}>{g}</p>;
                      })()}
                    </div>
                  )}
                  {product.novaGroup !== undefined && (
                    <div className="bg-gray-50 rounded-2xl p-3 text-center">
                      <p className="text-xs text-gray-400 font-semibold mb-1">NOVA</p>
                      <p className={`text-xl font-black ${
                        product.novaGroup === 1 ? 'text-green-600' :
                        product.novaGroup === 2 ? 'text-lime-600' :
                        product.novaGroup === 3 ? 'text-yellow-600' : 'text-red-600'
                      }`}>{product.novaGroup}</p>
                    </div>
                  )}
                  {product.ecoGrade !== undefined && (
                    <div className="bg-gray-50 rounded-2xl p-3 text-center">
                      <p className="text-xs text-gray-400 font-semibold mb-1">Eco</p>
                      <p className={`text-xl font-black ${
                        product.ecoGrade === 'a' ? 'text-green-600' :
                        product.ecoGrade === 'b' ? 'text-lime-600' :
                        product.ecoGrade === 'c' ? 'text-yellow-600' :
                        product.ecoGrade === 'd' ? 'text-orange-600' : 'text-red-600'
                      }`}>{product.ecoGrade.toUpperCase()}</p>
                    </div>
                  )}
                  {product.novaGroup === undefined && product.nutriscoreScore === undefined && product.ecoGrade === undefined && (
                    <div className="col-span-3 text-center text-xs text-gray-300 py-2">ไม่มีข้อมูลคะแนนเพิ่มเติม</div>
                  )}
                </div>

                {/* Score breakdown */}
                {showScoreBreakdown && (
                  <div className="mt-5 text-left border-t border-gray-100 pt-5 animate-fadeUp">
                    <SafetyScoreBreakdown product={product} />
                  </div>
                )}
              </div>

              {/* NOVA + Eco detailed cards */}
              {(product.novaGroup !== undefined || product.ecoGrade !== undefined) && (
                <div className="space-y-3 animate-fadeUp delay-150">
                  {product.novaGroup  !== undefined && <NovaCard novaGroup={product.novaGroup} />}
                  {product.ecoGrade   !== undefined && <EcoCard  ecoGrade={product.ecoGrade} ecoScore={product.ecoScore} />}
                </div>
              )}

              {/* Nutriscore full */}
              {product.nutriscoreScore !== undefined && (() => {
                const grades = ['e','d','c','b','a'];
                const g = grades[product.nutriscoreScore - 1] ?? 'c';
                return (
                  <div className="animate-fadeUp delay-200">
                    <NutriScoreBadge grade={g} />
                  </div>
                );
              })()}

              {/* Ingredient & Additive Summary Pills */}
              <div className="grid grid-cols-2 gap-3 animate-fadeUp delay-200">
                <div className="card p-4">
                  <p className="text-xs text-gray-400 font-semibold mb-2">ส่วนผสม ({ingredients.length})</p>
                  <div className="flex items-center gap-3">
                    <div className="text-center">
                      <p className="text-lg font-black text-green-600">{ingredients.filter(i => i.status === 'safe').length}</p>
                      <p className="text-[10px] text-gray-400">ปลอดภัย</p>
                    </div>
                    <div className="text-center">
                      <p className="text-lg font-black text-yellow-600">{cautionCount}</p>
                      <p className="text-[10px] text-gray-400">ระวัง</p>
                    </div>
                    <div className="text-center">
                      <p className={`text-lg font-black ${riskCount > 0 ? 'text-red-600' : 'text-gray-300'}`}>{riskCount}</p>
                      <p className="text-[10px] text-gray-400">เสี่ยง</p>
                    </div>
                  </div>
                </div>
                <div className="card p-4">
                  <p className="text-xs text-gray-400 font-semibold mb-2">วัตถุเจือปน ({additives.length})</p>
                  <div className="flex items-center gap-3">
                    <div className="text-center">
                      <p className="text-lg font-black text-green-600">{additives.filter(a => a.severity === 'safe').length}</p>
                      <p className="text-[10px] text-gray-400">ปลอดภัย</p>
                    </div>
                    <div className="text-center">
                      <p className="text-lg font-black text-yellow-600">{cautionAdditives}</p>
                      <p className="text-[10px] text-gray-400">ระวัง</p>
                    </div>
                    <div className="text-center">
                      <p className={`text-lg font-black ${riskAdditives > 0 ? 'text-red-600' : 'text-gray-300'}`}>{riskAdditives}</p>
                      <p className="text-[10px] text-gray-400">เสี่ยง</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Allergens + Traces */}
              {(product.allergens.length > 0 || (product.traces?.length ?? 0) > 0) && (
                <div className="card p-5 animate-fadeUp delay-250">
                  <SectionTitle icon="warning" color="text-orange-500">สารก่อภูมิแพ้</SectionTitle>
                  <AllergenChips allergens={product.allergens} traces={product.traces} />
                </div>
              )}

              {/* Manufacturer Info */}
              <div className="card p-5 animate-fadeUp delay-300">
                <SectionTitle icon="factory">ข้อมูลผู้ผลิต</SectionTitle>
                <div className="divide-y divide-gray-50">
                  <InfoRow label="แบรนด์"        value={product.brand} />
                  <InfoRow label="ผู้ผลิต"        value={product.manufacturer ?? '—'} />
                  {product.manufacturerAddress && (
                    <InfoRow label="แหล่งผลิต"    value={product.manufacturerAddress} />
                  )}
                  <InfoRow label="ประเทศ"         value={product.country} />
                  {product.barcodeCountry && product.barcodeCountry !== product.country && (
                    <InfoRow label="ประเทศบาร์โค้ด" value={`${product.barcodeCountry} (${product.barcodeType ?? ''})`} />
                  )}
                  <InfoRow label="บาร์โค้ด"       value={`${product.barcode} (${product.barcodeType ?? 'EAN-13'})`} />
                  {product.quantity && <InfoRow label="ปริมาณ" value={product.quantity} />}
                  {product.packaging && <InfoRow label="บรรจุภัณฑ์" value={product.packaging} />}
                </div>
              </div>
            </div>

            {/* ══ RIGHT COLUMN ══ */}
            <div className="space-y-5">

              {/* Tabbed content: Nutrition / Ingredients / Additives / Info */}
              <div className="card overflow-hidden animate-fadeUp delay-100">
                {/* Tab strip */}
                <div className="flex border-b border-gray-100 overflow-x-auto scrollbar-none">
                  {([
                    { id: 'nutrition',   icon: 'nutrition',   label: 'โภชนาการ' },
                    { id: 'ingredients', icon: 'science',     label: `ส่วนผสม${ingredients.length > 0 ? ` (${ingredients.length})` : ''}` },
                    { id: 'additives',   icon: 'biotech',     label: `วัตถุเจือปน${additives.length > 0 ? ` (${additives.length})` : ''}` },
                    { id: 'info',        icon: 'info',        label: 'รายละเอียด' },
                    { id: 'reviews',     icon: 'forum',       label: 'รีวิว' },
                  ] as const).map(tab => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex-shrink-0 flex items-center gap-1.5 px-4 py-3.5 text-sm font-semibold transition-colors cursor-pointer whitespace-nowrap
                        ${activeTab === tab.id
                          ? 'text-primary-600 border-b-2 border-primary-500 -mb-px bg-primary-50/50'
                          : 'text-gray-400 hover:text-gray-600'
                        }`}
                    >
                      <span className="material-symbols-outlined text-sm">{tab.icon}</span>
                      {tab.label}
                    </button>
                  ))}
                </div>

                <div className="p-5">

                  {/* ── Nutrition Tab ── */}
                  {activeTab === 'nutrition' && (
                    hasNutrition ? (
                      <div className="space-y-5">
                        {/* Serving toggle */}
                        {servingWeight && (
                          <div className="flex items-center justify-between bg-gray-50 rounded-2xl p-3 border border-gray-100">
                            <p className="text-xs text-gray-600 font-medium">
                              {perServing
                                ? `ต่อ 1 serving (${servingWeight}g)`
                                : 'ต่อ 100g'}
                            </p>
                            <div className="flex bg-white border border-gray-200 rounded-xl p-0.5 gap-0.5">
                              <button
                                onClick={() => setPerServing(false)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                                  !perServing ? 'bg-primary-500 text-white shadow-sm' : 'text-gray-500 hover:text-gray-700'
                                }`}
                              >
                                100g
                              </button>
                              <button
                                onClick={() => setPerServing(true)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                                  perServing ? 'bg-primary-500 text-white shadow-sm' : 'text-gray-500 hover:text-gray-700'
                                }`}
                              >
                                1 serving
                              </button>
                            </div>
                          </div>
                        )}

                        {/* Calorie highlight */}
                        <div className="flex items-center justify-between p-4 bg-gradient-to-r from-primary-50 to-blue-50 rounded-2xl border border-primary-100">
                          <div className="flex items-center gap-2">
                            <span className="material-symbols-outlined text-primary-500">local_fire_department</span>
                            <span className="font-bold text-gray-700">พลังงาน</span>
                          </div>
                          <div className="text-right">
                            <span className="text-3xl font-black text-primary-600 tabular-nums">{(nutrition.calories * servingMultiplier).toFixed(0)}</span>
                            <span className="text-sm text-gray-400 ml-1">kcal</span>
                            <p className="text-xs text-gray-400 mt-0.5">{perServing && servingWeight ? `ต่อ 1 serving` : 'ต่อ 100g'} • DV: {Math.round((nutrition.calories * servingMultiplier / DAILY_VALUES.calories) * 100)}%</p>
                          </div>
                        </div>

                        {/* Macros */}
                        <div>
                          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">สารอาหารหลัก</p>
                          <div className="space-y-3">
                            <NutritionBarDV label="โปรตีน"      value={nutrition.protein}          unit="g"  max={50}   color="bg-blue-500"    dvKey="protein"      icon="fitness_center" delay={0}    servingMultiplier={servingMultiplier} />
                            <NutritionBarDV label="ไขมันรวม"     value={nutrition.fat}              unit="g"  max={100}  color="bg-orange-400"  dvKey="fat"          icon="water_drop"     delay={40}   servingMultiplier={servingMultiplier} />
                            <NutritionBarDV label="ไขมันอิ่มตัว" value={nutrition.saturatedFat}     unit="g"  max={30}   color="bg-red-400"     dvKey="saturatedFat"                       delay={80}   servingMultiplier={servingMultiplier} />
                            {nutrition.transFat !== undefined && nutrition.transFat > 0 && (
                              <NutritionBarDV label="ไขมันทรานส์" value={nutrition.transFat}        unit="g"  max={5}    color="bg-red-600"                                                 delay={100}  servingMultiplier={servingMultiplier} />
                            )}
                            <NutritionBarDV label="คาร์โบไฮเดรต" value={nutrition.carbs}            unit="g"  max={300}  color="bg-yellow-400"  dvKey="carbs"        icon="grain"          delay={120}  servingMultiplier={servingMultiplier} />
                            <NutritionBarDV label="น้ำตาล"        value={nutrition.sugar}            unit="g"  max={100}  color="bg-pink-400"    dvKey="sugar"        icon="cake"           delay={160}  servingMultiplier={servingMultiplier} />
                            {nutrition.addedSugar !== undefined && (
                              <NutritionBarDV label="น้ำตาลเติม"  value={nutrition.addedSugar}       unit="g"  max={50}   color="bg-pink-600"                                                delay={180}  servingMultiplier={servingMultiplier} />
                            )}
                            <NutritionBarDV label="ใยอาหาร"       value={nutrition.fiber}            unit="g"  max={30}   color="bg-green-500"   dvKey="fiber"        icon="eco"            delay={200}  servingMultiplier={servingMultiplier} />
                            <NutritionBarDV label="โซเดียม"       value={nutrition.sodium * 1000}    unit="mg" max={3000} color="bg-purple-400"  dvKey="sodium"                             delay={240}  servingMultiplier={servingMultiplier} />
                            {nutrition.cholesterol !== undefined && (
                              <NutritionBarDV label="คอเลสเตอรอล" value={nutrition.cholesterol}      unit="mg" max={400}  color="bg-red-300"     dvKey="cholesterol"                        delay={280}  servingMultiplier={servingMultiplier} />
                            )}
                          </div>
                        </div>

                        {/* Minerals */}
                        {minerals.length > 0 && (
                          <div>
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">แร่ธาตุ</p>
                            <div className="space-y-3">
                              {minerals.map((m, i) => (
                                <NutritionBarDV
                                  key={m.key}
                                  label={m.label}
                                  value={m.value!}
                                  unit={m.unit}
                                  max={m.max}
                                  color={m.color}
                                  delay={i * 40}
                                  servingMultiplier={servingMultiplier}
                                />
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Vitamins */}
                        {vitamins.length > 0 && (
                          <div>
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">วิตามิน</p>
                            <div className="space-y-3">
                              {vitamins.map((v, i) => (
                                <NutritionBarDV
                                  key={v.key}
                                  label={v.label}
                                  value={v.value!}
                                  unit={v.unit}
                                  max={v.max}
                                  color={v.color}
                                  delay={i * 40}
                                  servingMultiplier={servingMultiplier}
                                />
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Per serving note */}
                        {product.servingSize && (
                          <p className="text-xs text-gray-400 text-center border-t border-gray-50 pt-3">
                            ข้อมูลต่อ 100g · ขนาด 1 serving = {product.servingSize}
                          </p>
                        )}
                      </div>
                    ) : (
                      <div className="py-8 text-center">
                        <span className="material-symbols-outlined text-gray-200 text-5xl mb-3 block">nutrition</span>
                        <p className="text-gray-400 font-medium">ไม่มีข้อมูลโภชนาการ</p>
                      </div>
                    )
                  )}

                  {/* ── Ingredients Tab ── */}
                  {activeTab === 'ingredients' && (
                    ingredients.length > 0 ? (
                      <div className="space-y-2">
                        {visibleIngredients.map((ing, i) => {
                          const cfg  = STATUS_CONFIG[ing.status];
                          const open = openIngredient === i;
                          return (
                            <div
                              key={i}
                              className={`border rounded-2xl overflow-hidden transition-all duration-200 ${cfg.bg} ${cfg.border}`}
                              style={{ animationDelay: `${i * 30}ms` }}
                            >
                              <button
                                className="w-full flex items-center justify-between px-4 py-3.5 cursor-pointer press-sm focus-ring text-left"
                                onClick={() => setOpenIngredient(open ? null : i)}
                                aria-expanded={open}
                              >
                                <div className="flex items-center gap-3 min-w-0">
                                  <span className={`w-2 h-2 rounded-full flex-shrink-0 ${cfg.dotColor}`} />
                                  <span className="font-semibold text-gray-800 text-sm truncate">{ing.name}</span>
                                  {ing.isAllergen && (
                                    <span className="flex-shrink-0 w-4 h-4 rounded-full bg-orange-500 flex items-center justify-center">
                                      <span className="material-symbols-outlined text-white text-[10px]">warning</span>
                                    </span>
                                  )}
                                </div>
                                <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                                  {ing.ewgScore !== undefined && (
                                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                                      ing.ewgScore >= 7 ? 'bg-red-100 text-red-700' :
                                      ing.ewgScore >= 4 ? 'bg-yellow-100 text-yellow-700' :
                                      'bg-green-100 text-green-700'
                                    }`}>
                                      EWG {ing.ewgScore}
                                    </span>
                                  )}
                                  <span className={`chip text-[10px] ${cfg.bg} ${cfg.text} ${cfg.border}`}>{cfg.label}</span>
                                  <span className={`material-symbols-outlined text-gray-400 text-sm transition-transform duration-200 ${open ? 'rotate-180' : ''}`}>
                                    expand_more
                                  </span>
                                </div>
                              </button>
                              {open && (
                                <div className={`px-4 pb-4 pt-1 text-sm text-gray-600 border-t ${cfg.border} animate-fadeUp`}>
                                  <p className="font-semibold text-gray-700 mb-1">หน้าที่: <span className="font-normal">{ing.function}</span></p>
                                  {ing.percent !== undefined && (
                                    <p className="font-semibold text-gray-700 mb-1">ปริมาณ: <span className="font-normal">{ing.percent}%</span></p>
                                  )}
                                  {ing.vegan !== undefined && (
                                    <p className="font-semibold text-gray-700 mb-1">
                                      วีแกน: <span className={`font-normal ${ing.vegan ? 'text-green-600' : 'text-red-600'}`}>{ing.vegan ? 'ใช่' : 'ไม่ใช่'}</span>
                                    </p>
                                  )}
                                  <p className="leading-relaxed">{ing.description}</p>
                                </div>
                              )}
                            </div>
                          );
                        })}
                        {ingredients.length > 10 && (
                          <button
                            onClick={() => setShowAllIngredients(!showAllIngredients)}
                            className="w-full py-2.5 text-sm font-semibold text-primary-600 hover:text-primary-700 cursor-pointer"
                          >
                            {showAllIngredients ? 'แสดงน้อยลง' : `+ ดูส่วนผสมทั้งหมด ${ingredients.length} รายการ`}
                          </button>
                        )}

                        {/* Raw ingredient text accordion */}
                        {product.ingredientsText && (
                          <div className="rounded-2xl border border-gray-100 overflow-hidden">
                            <button
                              className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer press-sm"
                              onClick={() => setShowRawIngText(v => !v)}
                              aria-expanded={showRawIngText}
                            >
                              <span className="flex items-center gap-2 text-sm font-semibold text-gray-600">
                                <span className="material-symbols-outlined text-gray-400 text-base">subject</span>
                                ข้อความส่วนผสมต้นฉบับ (จาก Open Food Facts)
                              </span>
                              <span className={`material-symbols-outlined text-gray-400 text-sm transition-transform duration-200 ${showRawIngText ? 'rotate-180' : ''}`}>
                                expand_more
                              </span>
                            </button>
                            {showRawIngText && (
                              <div className="px-4 py-3 animate-fadeUp">
                                <p className="text-xs text-gray-500 leading-relaxed font-mono whitespace-pre-wrap break-words">
                                  {product.ingredientsText}
                                </p>
                                <p className="text-[10px] text-gray-300 mt-2">
                                  ข้อมูลดิบจาก API — อาจมีภาษาหลายภาษาปนกัน
                                </p>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="py-8 text-center">
                        <span className="material-symbols-outlined text-gray-200 text-5xl mb-3 block">science</span>
                        <p className="text-gray-400 font-medium">ไม่มีข้อมูลส่วนผสม</p>
                      </div>
                    )
                  )}

                  {/* ── Additives Tab ── */}
                  {activeTab === 'additives' && (
                    additives.length > 0 ? (
                      <div className="space-y-2">
                        {/* Interaction warnings — shown FIRST */}
                        {interactions.length > 0 && (
                          <div className="space-y-2 mb-2">
                            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
                              <span className="material-symbols-outlined text-red-500 text-sm">merge</span>
                              ปฏิกิริยาระหว่างสารเจือปน
                            </p>
                            {interactions.map((inter, i) => (
                              <div
                                key={inter.id}
                                className={`rounded-2xl border p-4 animate-fadeUp ${
                                  inter.severity === 'critical' ? 'bg-red-50 border-red-200' :
                                  inter.severity === 'high'     ? 'bg-orange-50 border-orange-200' :
                                                                  'bg-yellow-50 border-yellow-200'
                                }`}
                                style={{ animationDelay: `${i * 50}ms` }}
                              >
                                <div className="flex items-start gap-3">
                                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${
                                    inter.severity === 'critical' ? 'bg-red-100' :
                                    inter.severity === 'high'     ? 'bg-orange-100' : 'bg-yellow-100'
                                  }`}>
                                    <span className={`material-symbols-outlined text-sm ${
                                      inter.severity === 'critical' ? 'text-red-600' :
                                      inter.severity === 'high'     ? 'text-orange-600' : 'text-yellow-600'
                                    }`}>{inter.icon}</span>
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                                      <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${
                                        inter.severity === 'critical' ? 'bg-red-200 text-red-800' :
                                        inter.severity === 'high'     ? 'bg-orange-200 text-orange-800' : 'bg-yellow-200 text-yellow-800'
                                      }`}>
                                        {inter.severity === 'critical' ? 'วิกฤต' : inter.severity === 'high' ? 'สูง' : 'ปานกลาง'}
                                      </span>
                                      {inter.codes.map(c => (
                                        <span key={c} className="text-[10px] font-mono font-bold bg-white/70 border border-gray-200 px-1.5 py-0.5 rounded-lg text-gray-700">{c}</span>
                                      ))}
                                    </div>
                                    <p className={`font-bold text-sm mb-1 ${
                                      inter.severity === 'critical' ? 'text-red-900' :
                                      inter.severity === 'high'     ? 'text-orange-900' : 'text-yellow-900'
                                    }`}>{inter.title}</p>
                                    <p className="text-xs text-gray-600 leading-relaxed mb-1">{inter.description}</p>
                                    <p className="text-[10px] text-gray-400 italic">อ้างอิง: {inter.reference}</p>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Risk summary banner */}
                        {(riskAdditives > 0 || cautionAdditives > 0) && (
                          <div className={`flex items-start gap-3 p-3 rounded-2xl mb-2 border ${
                            riskAdditives > 0 ? 'bg-red-50 border-red-200' : 'bg-yellow-50 border-yellow-200'
                          }`}>
                            <span className={`material-symbols-outlined ${riskAdditives > 0 ? 'text-red-500' : 'text-yellow-600'}`}>warning</span>
                            <div>
                              <p className={`text-sm font-bold ${riskAdditives > 0 ? 'text-red-800' : 'text-yellow-800'}`}>
                                {riskAdditives > 0
                                  ? `พบ ${riskAdditives} วัตถุเจือปนที่มีความเสี่ยงสูง`
                                  : `พบ ${cautionAdditives} วัตถุเจือปนที่ควรระวัง`
                                }
                              </p>
                              <p className={`text-xs mt-0.5 ${riskAdditives > 0 ? 'text-red-600' : 'text-yellow-700'}`}>
                                แนะนำให้อ่านรายละเอียดด้านล่าง
                              </p>
                            </div>
                          </div>
                        )}

                        {visibleAdditives.map((add, i) => {
                          const cfg  = ADDITIVE_SEVERITY[add.severity];
                          const open = openAdditive === i;
                          return (
                            <div
                              key={i}
                              className={`border rounded-2xl overflow-hidden ${cfg.bg} ${cfg.border}`}
                              style={{ animationDelay: `${i * 30}ms` }}
                            >
                              <button
                                className="w-full flex items-center justify-between px-4 py-3.5 cursor-pointer press-sm text-left"
                                onClick={() => setOpenAdditive(open ? null : i)}
                                aria-expanded={open}
                              >
                                <div className="flex items-center gap-3 min-w-0">
                                  <span className={`font-black text-sm flex-shrink-0 px-2 py-0.5 rounded-lg border ${cfg.bg} ${cfg.text} ${cfg.border}`}>
                                    {add.code}
                                  </span>
                                  <span className="font-semibold text-gray-800 text-sm truncate">{add.name}</span>
                                </div>
                                <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                                  <span className={`chip text-[10px] ${cfg.bg} ${cfg.text} ${cfg.border}`}>{cfg.label}</span>
                                  <span className={`material-symbols-outlined text-gray-400 text-sm transition-transform duration-200 ${open ? 'rotate-180' : ''}`}>
                                    expand_more
                                  </span>
                                </div>
                              </button>
                              {open && (
                                <div className={`px-4 pb-4 pt-1 text-sm text-gray-600 border-t ${cfg.border} animate-fadeUp space-y-1.5`}>
                                  <p className="font-semibold text-gray-700">หน้าที่: <span className="font-normal">{add.function}</span></p>
                                  {add.adi && (
                                    <p className="font-semibold text-gray-700">ปริมาณปลอดภัย (ADI): <span className="font-normal">{add.adi}</span></p>
                                  )}
                                  {add.restricted && (
                                    <p className="font-semibold text-orange-700">ถูกห้ามใช้ใน: <span className="font-normal">{add.restricted}</span></p>
                                  )}
                                  <p className="leading-relaxed">{add.description}</p>
                                </div>
                              )}
                            </div>
                          );
                        })}
                        {additives.length > 8 && (
                          <button
                            onClick={() => setShowAllAdditives(!showAllAdditives)}
                            className="w-full py-2.5 text-sm font-semibold text-primary-600 hover:text-primary-700 cursor-pointer"
                          >
                            {showAllAdditives ? 'แสดงน้อยลง' : `+ ดูวัตถุเจือปนทั้งหมด ${additives.length} รายการ`}
                          </button>
                        )}
                      </div>
                    ) : (
                      <div className="py-8 text-center">
                        <span className="material-symbols-outlined text-gray-200 text-5xl mb-3 block">biotech</span>
                        <p className="text-gray-400 font-medium text-sm">ไม่พบข้อมูลวัตถุเจือปน</p>
                        <p className="text-xs text-gray-300 mt-1">อาจเป็นสินค้าที่ไม่มีการเติมวัตถุเจือปน หรือยังไม่มีข้อมูลในฐานข้อมูล</p>
                      </div>
                    )
                  )}

                  {/* ── Info Tab ── */}
                  {activeTab === 'info' && (
                    <div className="space-y-4">
                      {/* Certifications */}
                      <div>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">การรับรอง</p>
                        <ProductLabels product={product} />
                        {!product.isOrganic && !product.isVegan && !product.isVegetarian &&
                         !product.isGlutenFree && !product.isHalal && !product.isKosher &&
                         !product.isFairTrade && !product.isPalmOilFree && (
                          <p className="text-sm text-gray-400">ไม่มีข้อมูลการรับรองพิเศษ</p>
                        )}
                      </div>

                      {/* Stores */}
                      {product.stores && product.stores.length > 0 && (
                        <div>
                          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">จำหน่ายที่</p>
                          <div className="flex flex-wrap gap-1.5">
                            {product.stores.map((s, i) => (
                              <span key={i} className="chip bg-gray-50 text-gray-600 border-gray-200 text-xs">{s}</span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Open Food Facts link */}
                      {product.offUrl && (
                        <a
                          href={product.offUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 p-3 bg-gray-50 hover:bg-primary-50 border border-gray-100 hover:border-primary-200 rounded-xl transition-all cursor-pointer"
                        >
                          <span className="material-symbols-outlined text-primary-500 text-lg">open_in_new</span>
                          <div>
                            <p className="font-semibold text-gray-800 text-sm">ดูข้อมูลเพิ่มเติม</p>
                            <p className="text-xs text-gray-400">Open Food Facts</p>
                          </div>
                        </a>
                      )}
                    </div>
                  )}

                  {/* ── Reviews Tab ── */}
                  {activeTab === 'reviews' && (
                    <div className="space-y-4 animate-fadeIn">
                      {!user ? (
                        <div className="bg-primary-50 border border-primary-100 rounded-2xl p-4 text-center">
                          <span className="material-symbols-outlined text-primary-400 text-3xl mb-2">lock_open</span>
                          <p className="text-sm text-gray-700 font-medium mb-3">เข้าสู่ระบบเพื่อเขียนรีวิวสินค้า แบ่งปันประสบการณ์ของคุณให้ชุมชน!</p>
                          <button onClick={() => navigate('/login')} className="btn-primary py-2 px-6 text-xs uppercase tracking-wider">เข้าสู่ระบบ</button>
                        </div>
                      ) : (
                        <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
                          <p className="text-sm font-bold text-gray-800 mb-2">เขียนรีวิวของคุณ</p>
                          <div className="flex gap-1 mb-3">
                            {[1, 2, 3, 4, 5].map(star => (
                              <button 
                                key={star} 
                                onClick={() => setRating(star)}
                                className={`text-2xl transition-all cursor-pointer hover:scale-110 active:scale-95 ${star <= rating ? 'text-yellow-400 drop-shadow-sm' : 'text-gray-300 hover:text-yellow-300'}`}
                              >
                                ★
                              </button>
                            ))}
                          </div>
                          <textarea 
                            value={reviewText}
                            onChange={(e) => setReviewText(e.target.value)}
                            placeholder="ตัวอย่าง: รสชาติอร่อยมาก ไม่หวานเกินไป แต่หาซื้อยาก..." 
                            className="w-full bg-white border border-gray-200 rounded-xl p-3 text-sm focus:outline-none focus:border-primary-300 focus:ring-2 focus:ring-primary-100 min-h-[80px] resize-none mb-3 placeholder:text-gray-400"
                            disabled={submittingReview}
                          ></textarea>
                          <button 
                            onClick={handleSubmitReview}
                            disabled={submittingReview || rating === 0 || !reviewText.trim()}
                            className="btn-primary w-full py-2.5 text-sm cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                          >
                            {submittingReview ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span> : <span className="material-symbols-outlined text-sm">send</span>}
                            {submittingReview ? 'กำลังส่ง...' : 'ส่งรีวิว'}
                          </button>
                        </div>
                      )}
                      
                      <div className="space-y-3 pt-2">
                        <p className="text-sm font-bold text-gray-800 px-1 border-b border-gray-100 pb-2 flex justify-between items-center">
                          รีวิวล่าสุด
                          <span className="text-xs font-semibold bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{productReviews.length} รีวิว</span>
                        </p>
                        
                        {reviewsLoading ? (
                          <div className="space-y-4">
                            {[1, 2].map(i => (
                              <div key={i} className="animate-pulse bg-white p-4 rounded-xl border border-gray-100">
                                <div className="flex gap-3 mb-3">
                                  <div className="w-10 h-10 bg-gray-200 rounded-full flex-shrink-0"></div>
                                  <div className="flex-1 space-y-2 py-1">
                                    <div className="h-3 bg-gray-200 rounded w-1/3"></div>
                                    <div className="h-2 bg-gray-100 rounded w-1/4"></div>
                                  </div>
                                </div>
                                <div className="h-16 bg-gray-50 rounded-lg"></div>
                              </div>
                            ))}
                          </div>
                        ) : productReviews.length > 0 ? (
                          <div className="space-y-3">
                            {productReviews.map((review, i) => {
                              const reviewerName = review.profiles?.display_name || 'ผู้ใช้งานไม่ระบุตัวตน';
                              const avatar = review.profiles?.avatar_url;
                              const initial = reviewerName.charAt(0).toUpperCase();

                              return (
                                <div key={review.id} className="p-4 rounded-2xl border border-gray-100 bg-white hover:border-primary-100 transition-colors" style={{ animationDelay: `${i * 50}ms` }}>
                                  <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-3">
                                      {avatar ? (
                                        <img src={avatar} alt={reviewerName} className="w-10 h-10 rounded-full object-cover border border-gray-100" />
                                      ) : (
                                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center text-gray-600 font-bold">
                                          {initial}
                                        </div>
                                      )}
                                      <div>
                                        <p className="text-sm font-bold text-gray-800">{reviewerName}</p>
                                        <p className="text-[10px] text-gray-400 font-medium">{timeAgo(review.created_at)}</p>
                                      </div>
                                    </div>
                                    <div className="flex items-center bg-yellow-50 px-2 py-0.5 rounded-full border border-yellow-100">
                                      <span className="font-bold text-yellow-600 text-xs mr-1">{review.rating}.0</span>
                                      <span className="text-yellow-400 text-xs shadow-sm">★</span>
                                    </div>
                                  </div>
                                  <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">{review.review_text}</p>
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <div className="py-8 text-center bg-gray-50 rounded-2xl border border-gray-100 border-dashed animate-fadeIn">
                            <span className="material-symbols-outlined text-gray-300 text-4xl mb-2 block">forum</span>
                            <p className="text-sm text-gray-500 font-medium">ยังไม่มีรีวิวสำหรับสินค้านี้</p>
                            <p className="text-xs text-gray-400 mt-1">เป็นคนแรกที่เขียนรีวิวสินค้านี้สิ!</p>
                          </div>
                        )}
                        
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Safer Alternatives */}
              {(alternatives.length > 0 || altLoading) && (
                <div className="card p-5 animate-fadeUp delay-200">
                  <SectionTitle icon="trending_up" color="text-green-500">
                    ทางเลือกที่ดีกว่า
                  </SectionTitle>
                  {altLoading ? (
                    <div className="space-y-3">
                      {[1,2].map(i => (
                        <div key={i} className="h-16 bg-gray-100 rounded-2xl animate-pulse" />
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {alternatives.map((alt, i) => (
                        <Link
                          key={i}
                          to={`/product/${alt.barcode}`}
                          state={{ product: alt }}
                          className="flex items-center gap-3 p-3 bg-green-50 border border-green-100 rounded-2xl hover:shadow-card transition-all duration-150"
                          style={{ animationDelay: `${i * 60}ms` }}
                        >
                          <div className="w-12 h-12 rounded-xl bg-white border border-green-100 overflow-hidden flex-shrink-0">
                            {alt.image ? (
                              <img src={alt.image} alt={alt.name} className="w-full h-full object-contain p-1" />
                            ) : (
                              <span className="material-symbols-outlined text-gray-200 text-2xl flex items-center justify-center w-full h-full">inventory_2</span>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-gray-800 text-sm truncate">{alt.name}</p>
                            <p className="text-xs text-gray-400 truncate">{alt.brand}</p>
                          </div>
                          <div className="flex flex-col items-end gap-1 flex-shrink-0">
                            <GradeBadge grade={alt.grade} size="sm" />
                            <span className="text-xs font-bold text-green-600">{alt.safetyScore}pts</span>
                          </div>
                        </Link>
                      ))}
                      <p className="text-xs text-gray-400 text-center">ข้อมูลจาก Open Food Facts</p>
                    </div>
                  )}
                </div>
              )}

              {/* Buy Section */}
              <div className="card p-5 animate-fadeUp delay-300">
                <SectionTitle icon="storefront">ซื้อสินค้านี้</SectionTitle>
                <p className="text-sm text-gray-400 -mt-2 mb-4">เลือกร้านค้าและซื้อได้เลย</p>
                <div className="grid grid-cols-2 gap-2 mb-4">
                  {product.buyOptions.map(opt => (
                    <a
                      key={opt.store}
                      href={opt.searchUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2.5 p-3 bg-gray-50 hover:bg-primary-50 border border-gray-100 hover:border-primary-200 rounded-xl transition-all duration-150 press-sm cursor-pointer"
                    >
                      <div className="w-8 h-8 rounded-lg bg-gray-200 flex items-center justify-center flex-shrink-0">
                        <span className="material-symbols-outlined text-gray-500 text-sm">store</span>
                      </div>
                      <div>
                        <p className="font-bold text-sm text-gray-900">{opt.store}</p>
                        <p className="text-xs text-primary-500 flex items-center gap-0.5">
                          ดูสินค้า
                          <span className="material-symbols-outlined text-[11px]">open_in_new</span>
                        </p>
                      </div>
                    </a>
                  ))}
                </div>
                <button
                  onClick={() => setShowBuyModal(true)}
                  className="w-full btn-primary flex items-center justify-center gap-2 py-4 text-base cursor-pointer"
                >
                  <span className="material-symbols-outlined">shopping_cart</span>
                  ซื้อเลย / ใส่ตะกร้า
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showBuyModal && (
        <BuyModal product={product} onClose={() => setShowBuyModal(false)} />
      )}
    </>
  );
}
