import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useProductLookup, fetchAndParseProduct } from '../hooks/useProductLookup';
import { useFeaturedProducts } from '../hooks/useFeaturedProducts';
import { DEMO_SCAN_ITEMS, SCAN_TIPS } from '../data';
import { analyzeBarcodeType, validateEAN13 } from '../lib/barcodeUtils';
import { gradeColorClasses } from '../lib/utils';
import type { Product } from '../types';
import { useAuth } from '../context/AuthContext';
import { applyHealthGoals } from '../lib/healthGoals';

// ── Recent barcodes (localStorage, max 10) ───────────────────────────────────
const RECENT_KEY = 'safescan_recent_barcodes';
function getRecent(): Array<{ code: string; name: string; ts: number }> {
  try { return JSON.parse(localStorage.getItem(RECENT_KEY) ?? '[]'); } catch { return []; }
}
function pushRecent(code: string, name: string) {
  try {
    const prev = getRecent().filter(r => r.code !== code);
    localStorage.setItem(RECENT_KEY, JSON.stringify([{ code, name, ts: Date.now() }, ...prev].slice(0, 10)));
  } catch {}
}

// ── Skeleton card ─────────────────────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div className="card p-5 space-y-4 overflow-hidden">
      {/* Shimmer overlay using CSS animation */}
      <div className="flex items-center gap-3">
        <div className="w-14 h-14 rounded-2xl skeleton flex-shrink-0" />
        <div className="flex-1 space-y-2.5">
          <div className="h-2.5 w-16 skeleton rounded-full" />
          <div className="h-4 w-44 skeleton rounded-full" />
          <div className="h-2.5 w-28 skeleton rounded-full" />
        </div>
        <div className="w-10 h-10 rounded-full skeleton flex-shrink-0" />
      </div>
      <div className="space-y-2">
        <div className="h-2 w-full skeleton rounded-full" />
        <div className="h-2 w-4/5 skeleton rounded-full" />
        <div className="h-2 w-3/5 skeleton rounded-full" />
      </div>
    </div>
  );
}

// ── Barcode validation feedback ───────────────────────────────────────────────
function BarcodeInputFeedback({ code }: { code: string }) {
  if (!code || code.length < 8) return null;

  const info    = analyzeBarcodeType(code);
  const isValid = (info.type === 'EAN-13' && validateEAN13(code)) ||
                  info.type === 'UPC-A' || info.type === 'EAN-8';

  return (
    <div className={`flex items-center gap-2 mt-2 px-3 py-2 rounded-xl border text-xs font-medium transition-all duration-300 animate-fadeUp ${
      isValid
        ? 'bg-green-50 border-green-200 text-green-700'
        : 'bg-yellow-50 border-yellow-200 text-yellow-700'
    }`}>
      <span className="material-symbols-outlined text-sm">{isValid ? 'check_circle' : 'info'}</span>
      <span>
        {info.type !== 'UNKNOWN' ? info.type : 'รูปแบบไม่ทราบ'}
        {info.countryCode && (
          <span className="ml-1.5 px-1.5 py-0.5 rounded-md bg-white/60 font-mono text-[10px] font-bold border border-current/20">
            {info.countryCode}
          </span>
        )}
        {info.barcodeCountry && ` ${info.barcodeCountry}`}
        {!isValid && info.type !== 'UNKNOWN' && ' · checksum ไม่ถูกต้อง'}
      </span>
    </div>
  );
}

// ── Category icon map ─────────────────────────────────────────────────────────
const CATEGORY_ICONS: Record<string, string> = {
  spread:    'egg_alt',
  biscuit:   'cookie',
  snack:     'restaurant',
  beverage:  'local_drink',
  chocolate: 'icecream',
  candy:     'sentiment_very_satisfied',
  cereal:    'grain',
  pasta:     'restaurant',
  dairy:     'water_drop',
  noodles:   'restaurant',
  default:   'inventory_2',
};


// ── Html5Qrcode instance typing ───────────────────────────────────────────────
interface Html5QrcodeInstance {
  isScanning: boolean;
  stop(): Promise<void>;
}

// ── Country code badge ────────────────────────────────────────────────────────
function CountryBadge({ code }: { code: string }) {
  return (
    <span className="inline-flex items-center px-1.5 py-0.5 rounded-md bg-gray-100 text-gray-500 text-[10px] font-bold font-mono leading-none border border-gray-200">
      {code}
    </span>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export function ScanPage() {
  const navigate  = useNavigate();
  const location  = useLocation();
  const { profile, addPoints } = useAuth();
  const healthGoals = profile?.health_goals ?? [];
  const { loading, error, lookupProduct, product } = useProductLookup();
  const { products: featuredProducts, loading: featuredLoading } = useFeaturedProducts();

  const [manualCode,      setManualCode]      = useState('');
  const [scannerActive,   setScannerActive]   = useState(false);
  const [scannerError,    setScannerError]    = useState('');
  const [activeDemo,      setActiveDemo]      = useState<string | null>(null);
  const [recentCodes,     setRecentCodes]     = useState(getRecent());
  const [tipIndex,        setTipIndex]        = useState(0);
  const [showRecent,      setShowRecent]      = useState(false);

  // Batch Mode States
  const [isBatchMode, setIsBatchMode] = useState(false);
  const isBatchModeRef = useRef(isBatchMode);
  // Keep ref in sync
  useEffect(() => { isBatchModeRef.current = isBatchMode; }, [isBatchMode]);

  const [batchProducts, setBatchProducts] = useState<Product[]>([]);
  const batchCodesRef = useRef<Set<string>>(new Set());

  // Pre-fetched demo product cache (barcode → Product)
  const [prefetched, setPrefetched] = useState<Map<string, Product>>(new Map());
  const [prefetchDone, setPrefetchDone] = useState(false);

  const scannerRef     = useRef<Html5QrcodeInstance | null>(null);
  const scannerMounted = useRef(false);

  // ── Auto-prefetch ALL demo items in background on mount ──
  useEffect(() => {
    let cancelled = false;
    const codes = DEMO_SCAN_ITEMS.map(d => d.code);

    // Fetch all in parallel, fire-and-forget
    Promise.all(codes.map(code => fetchAndParseProduct(code))).then(results => {
      if (cancelled) return;
      const map = new Map<string, Product>();
      results.forEach((p, i) => { if (p) map.set(codes[i], p); });
      setPrefetched(map);
      setPrefetchDone(true);
    }).catch(() => {});

    return () => { cancelled = true; };
  }, []);

  // Navigate on product found
  useEffect(() => {
    if (product) {
      pushRecent(product.barcode, product.name);
      setRecentCodes(getRecent());
      navigate(`/product/${product.barcode}`, { state: { product } });
    }
  }, [product]);

  // Auto-scan from HomePage quick-scan links
  useEffect(() => {
    const autoscan = location.state?.autoscan as string | undefined;
    if (autoscan && !loading) {
      setManualCode(autoscan);
      // Check prefetch cache first
      const cached = prefetched.get(autoscan);
      if (cached) {
        navigate(`/product/${cached.barcode}`, { state: { product: cached } });
      } else {
        setTimeout(() => lookupProduct(autoscan), 300);
      }
    }
  }, [location.state?.autoscan]);

  // Rotate scan tips every 4s
  useEffect(() => {
    const t = setInterval(() => setTipIndex(i => (i + 1) % SCAN_TIPS.length), 4000);
    return () => clearInterval(t);
  }, []);

  // ── Camera scanner ──
  const startScanner = async () => {
    setScannerActive(true);
    setScannerError('');
    scannerMounted.current = true;
    try {
      const { Html5Qrcode } = await import('html5-qrcode');
      const scanner = new Html5Qrcode('scanner-container');
      scannerRef.current = scanner;
      await scanner.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 260, height: 160 } },
        async (text: string) => {
          const code = text.trim();
          if (isBatchModeRef.current) {
            // Check if already scanned recently in this batch
            if (batchCodesRef.current.has(code)) return;
            batchCodesRef.current.add(code);
            
            // Haptic feedback if supported
            if (navigator.vibrate) navigator.vibrate(50);
            
            // Fetch silently
            fetchAndParseProduct(code).then(p => {
              if (p) {
                const tailored = applyHealthGoals(p, healthGoals);
                setBatchProducts(prev => [tailored, ...prev]);
                pushRecent(p.barcode, p.name);
                setRecentCodes(getRecent());
                if (profile) addPoints(5);
              } else {
                batchCodesRef.current.delete(code);
              }
            }).catch(() => {
              batchCodesRef.current.delete(code);
            });
          } else {
            // Normal scan
            await scanner.stop();
            setScannerActive(false);
            scannerMounted.current = false;
            await lookupProduct(code);
          }
        },
        () => {}
      );
    } catch (err) {
      const msg = err instanceof Error ? err.message.toLowerCase() : '';
      if (msg.includes('permission') || msg.includes('denied') || msg.includes('notallowed')) {
        setScannerError('กล้องถูกปฏิเสธ — กรุณาอนุญาตการเข้าถึงกล้องในการตั้งค่าเบราว์เซอร์ แล้วโหลดหน้าใหม่');
      } else if (msg.includes('notfound') || msg.includes('no camera') || msg.includes('devicenotfound')) {
        setScannerError('ไม่พบกล้องในอุปกรณ์ — กรุณาใช้การพิมพ์บาร์โค้ดด้วยตนเองแทน');
      } else if (msg.includes('https') || msg.includes('secure')) {
        setScannerError('กล้องต้องใช้งานผ่าน HTTPS — กรุณาใช้การพิมพ์บาร์โค้ดด้วยตนเองแทน');
      } else if (!navigator.mediaDevices) {
        setScannerError('เบราว์เซอร์นี้ไม่รองรับการใช้กล้อง — กรุณาใช้ Chrome หรือ Safari ล่าสุด');
      } else {
        setScannerError('ไม่สามารถเปิดกล้องได้ กรุณาลองใหม่ หรือใช้การพิมพ์บาร์โค้ดด้วยตนเอง');
      }
      setScannerActive(false);
    }
  };

  const stopScanner = async () => {
    try {
      if (scannerRef.current?.isScanning) await scannerRef.current.stop();
    } catch {}
    setScannerActive(false);
    scannerMounted.current = false;
  };

  useEffect(() => { return () => { if (scannerMounted.current) stopScanner(); }; }, []);

  const handleManualSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = manualCode.trim();
    if (!code) return;
    
    // Batch Mode Handling
    if (isBatchModeRef.current) {
      if (batchCodesRef.current.has(code)) {
        setManualCode('');
        return;
      }
      batchCodesRef.current.add(code);
      const cached = prefetched.get(code);
      if (cached) {
        const tailored = applyHealthGoals(cached, healthGoals);
        setBatchProducts(prev => [tailored, ...prev]);
        pushRecent(code, cached.name);
        setRecentCodes(getRecent());
        setManualCode('');
        return;
      }
      
      fetchAndParseProduct(code).then(p => {
        if (p) {
          const tailored = applyHealthGoals(p, healthGoals);
          setBatchProducts(prev => [tailored, ...prev]);
          pushRecent(p.barcode, p.name);
          setRecentCodes(getRecent());
          if (profile) addPoints(5);
        } else {
          batchCodesRef.current.delete(code);
        }
      }).catch(() => batchCodesRef.current.delete(code));
      setManualCode('');
      return;
    }

    // Normal non-batch mode
    // Check prefetch cache first for instant navigation
    const cached = prefetched.get(code);
    if (cached) {
      pushRecent(code, cached.name);
      setRecentCodes(getRecent());
      navigate(`/product/${code}`, { state: { product: applyHealthGoals(cached, healthGoals) } });
      return;
    }
    await lookupProduct(code);
  };

  const handleDemoScan = async (code: string) => {
    // Check prefetch cache for instant navigation
    const cached = prefetched.get(code);
    if (cached) {
      pushRecent(code, cached.name);
      setRecentCodes(getRecent());
      navigate(`/product/${code}`, { state: { product: applyHealthGoals(cached, healthGoals) } });
      return;
    }
    setActiveDemo(code);
    setManualCode(code);
    await lookupProduct(code);
    setActiveDemo(null);
  };

  const clearRecent = () => {
    localStorage.removeItem(RECENT_KEY);
    setRecentCodes([]);
    setShowRecent(false);
  };

  // Validate barcode as user types
  const codeInfo    = manualCode.length >= 8 ? analyzeBarcodeType(manualCode) : null;
  const isValidInput = codeInfo && codeInfo.type !== 'UNKNOWN';

  return (
    <div className="flex flex-col pb-28 md:pb-8 min-h-screen">

      {/* Header */}
      <header className="glassmorphism md:bg-transparent sticky top-0 z-40 px-5 md:px-8 pt-10 md:pt-8 pb-4 border-b border-primary-50 md:border-none animate-slideDown">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">สแกนสินค้า</h1>
            <p
              key={tipIndex}
              className="text-sm text-gray-400 mt-0.5 animate-fadeIn"
            >
              {SCAN_TIPS[tipIndex]}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {/* Prefetch status indicator */}
            {!prefetchDone && (
              <div className="flex items-center gap-1.5 text-xs text-primary-500 animate-fadeIn">
                <div className="w-3 h-3 border-2 border-primary-400 border-t-transparent rounded-full animate-spin" />
                <span className="hidden sm:block">กำลังโหลด...</span>
              </div>
            )}
            {recentCodes.length > 0 && (
              <button
                onClick={() => setShowRecent(!showRecent)}
                className="flex items-center gap-1.5 text-xs font-semibold text-primary-600 bg-primary-50 border border-primary-200 px-3 py-2 rounded-xl cursor-pointer press-sm transition-all hover:bg-primary-100"
              >
                <span className="material-symbols-outlined text-sm">history</span>
                ล่าสุด ({recentCodes.length})
              </button>
            )}
          </div>
        </div>
      </header>

      <div className="px-5 md:px-8 pt-6">

        {/* Recent scan history dropdown */}
        {showRecent && recentCodes.length > 0 && (
          <div className="card p-4 mb-5 animate-fadeUp">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-gray-800 text-sm flex items-center gap-2">
                <span className="material-symbols-outlined text-primary-500 text-base">history</span>
                สแกนล่าสุด
              </h3>
              <button onClick={clearRecent} className="text-xs text-gray-400 hover:text-red-500 cursor-pointer transition-colors">
                ลบทั้งหมด
              </button>
            </div>
            <div className="space-y-1">
              {recentCodes.map((r, i) => (
                <button
                  key={i}
                  onClick={() => handleDemoScan(r.code)}
                  disabled={loading}
                  className="w-full flex items-center gap-3 p-2.5 rounded-xl bg-gray-50 hover:bg-primary-50 text-left cursor-pointer press-sm disabled:opacity-50 transition-colors"
                  style={{ animationDelay: `${i * 30}ms` }}
                >
                  <span className="material-symbols-outlined text-gray-400 text-base">qr_code</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-gray-800 truncate">{r.name}</p>
                    <p className="text-xs text-gray-400 font-mono">{r.code}</p>
                  </div>
                  {activeDemo === r.code || (loading && manualCode === r.code) ? (
                    <div className="w-4 h-4 border-2 border-primary-400 border-t-transparent rounded-full animate-spin flex-shrink-0" />
                  ) : (
                    <span className="material-symbols-outlined text-gray-300 text-sm flex-shrink-0">arrow_forward_ios</span>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="md:grid md:grid-cols-2 md:gap-8 space-y-5 md:space-y-0">

          {/* ── LEFT: Scanner + Manual ── */}
          <div className="space-y-5">

            {/* Camera Scanner Card */}
            <div className="card overflow-hidden animate-fadeUp">
              {!scannerActive ? (
                <div className="flex flex-col items-center justify-center py-10 px-6 text-center">
                  {/* Animated scanner icon with concentric pulse rings */}
                  <div className="relative w-28 h-28 mb-6">
                    {/* Pulse rings */}
                    <div className="absolute inset-0 rounded-3xl border-2 border-primary-200 opacity-60 animate-[ping_2.5s_ease-in-out_infinite]" />
                    <div className="absolute inset-2 rounded-2xl border border-primary-100 opacity-40 animate-[ping_2.5s_0.8s_ease-in-out_infinite]" />
                    <div className="relative w-full h-full rounded-3xl bg-gradient-to-br from-primary-50 to-blue-50 flex items-center justify-center">
                      <span className="material-symbols-outlined text-primary-400 text-6xl">qr_code_scanner</span>
                    </div>
                    {/* Corner brackets */}
                    <div className="absolute top-2.5 left-2.5 w-5 h-5 border-t-2 border-l-2 border-primary-400 rounded-tl-lg" />
                    <div className="absolute top-2.5 right-2.5 w-5 h-5 border-t-2 border-r-2 border-primary-400 rounded-tr-lg" />
                    <div className="absolute bottom-2.5 left-2.5 w-5 h-5 border-b-2 border-l-2 border-primary-400 rounded-bl-lg" />
                    <div className="absolute bottom-2.5 right-2.5 w-5 h-5 border-b-2 border-r-2 border-primary-400 rounded-br-lg" />
                  </div>
                  <h2 className="text-lg font-bold text-gray-800 mb-1">พร้อมสแกน</h2>
                  <p className="text-sm text-gray-400 mb-6 max-w-[240px] leading-relaxed">
                    กดเปิดกล้อง แล้วชี้ไปที่บาร์โค้ดสินค้า รองรับ EAN-13, UPC-A, EAN-8
                  </p>
                  
                  {/* Batch Mode Toggle */}
                  <div className="flex items-center gap-3 mb-6 bg-gray-50 px-4 py-2.5 rounded-2xl border border-gray-100 w-full max-w-[240px]">
                    <span className="material-symbols-outlined text-gray-500">barcode_scanner</span>
                    <div className="flex-1 text-left">
                      <p className="text-sm font-semibold text-gray-800">สแกนต่อเนื่อง</p>
                      <p className="text-[10px] text-gray-500 mt-0.5">ค้นหาหลายชิ้นพร้อมกัน</p>
                    </div>
                    <button
                      onClick={() => {
                        const nextMod = !isBatchMode;
                        setIsBatchMode(nextMod);
                        if (!nextMod) {
                          setBatchProducts([]);
                          batchCodesRef.current.clear();
                        }
                      }}
                      className={`relative inline-flex h-6 w-11 flex-shrink-0 items-center rounded-full transition-colors focus:outline-none cursor-pointer ${isBatchMode ? 'bg-primary-500' : 'bg-gray-300'}`}
                      aria-label="Toggle batch mode"
                    >
                      <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${isBatchMode ? 'translate-x-6' : 'translate-x-1'}`} />
                    </button>
                  </div>

                  <button
                    onClick={startScanner}
                    className="btn-primary flex items-center gap-2 px-8 py-3.5 text-base cursor-pointer shadow-lg shadow-primary-200 hover:shadow-primary-300 transition-shadow w-full max-w-[240px] justify-center"
                  >
                    <span className="material-symbols-outlined">photo_camera</span>
                    เปิดกล้องสแกน
                  </button>
                  {scannerError && (
                    <div className="mt-4 flex items-start gap-2 bg-red-50 border border-red-100 text-red-600 text-sm px-4 py-3 rounded-xl animate-fadeUp w-full">
                      <span className="material-symbols-outlined text-sm flex-shrink-0 mt-0.5">error</span>
                      {scannerError}
                    </div>
                  )}
                </div>
              ) : (
                <div className="relative bg-black">
                  <div id="scanner-container" className="w-full min-h-[280px]" />
                  {/* Overlay frame */}
                  <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                    <div className="relative w-64 h-44">
                      <div className="absolute inset-0 shadow-[0_0_0_9999px_rgba(0,0,0,0.55)] rounded-2xl" />
                      <div className="absolute top-0 left-0 w-8 h-8 border-t-[3px] border-l-[3px] border-primary-400 rounded-tl-2xl" />
                      <div className="absolute top-0 right-0 w-8 h-8 border-t-[3px] border-r-[3px] border-primary-400 rounded-tr-2xl" />
                      <div className="absolute bottom-0 left-0 w-8 h-8 border-b-[3px] border-l-[3px] border-primary-400 rounded-bl-2xl" />
                      <div className="absolute bottom-0 right-0 w-8 h-8 border-b-[3px] border-r-[3px] border-primary-400 rounded-br-2xl" />
                      {/* Scan sweep line */}
                      <div
                        className="absolute left-2 right-2 h-0.5 bg-primary-400 rounded-full"
                        style={{ boxShadow: '0 0 10px #1E88E5, 0 0 20px #1E88E5', animation: 'scanSweep 2s ease-in-out infinite' }}
                      />
                    </div>
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/70 to-transparent">
                    <p className="text-white text-center text-sm font-medium mb-3 drop-shadow flex items-center justify-center gap-2">
                      {isBatchMode ? (
                        <>
                          <span className="material-symbols-outlined text-[16px] text-primary-400 animate-pulse">qr_code_scanner</span>
                          <span>กำลังสแกนต่อเนื่อง: ได้ <strong className="text-primary-300">{batchProducts.length}</strong> รายการ</span>
                        </>
                      ) : (
                        'วางบาร์โค้ดในกรอบ · ห่างประมาณ 15 ซม.'
                      )}
                    </p>
                    <button
                      onClick={stopScanner}
                      className="block mx-auto bg-white/20 backdrop-blur text-white font-semibold py-2 px-8 rounded-xl border border-white/30 hover:bg-white/30 transition-colors press-sm cursor-pointer"
                    >
                      ยกเลิก
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Batch Mode Results */}
            {isBatchMode && batchProducts.length > 0 && (
              <div className="card p-5 animate-fadeUp">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-bold text-gray-800 flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary-500 text-lg">list_alt</span>
                    รายการสแกน ({batchProducts.length})
                  </h3>
                  <button 
                    onClick={() => {
                      setBatchProducts([]);
                      batchCodesRef.current.clear();
                    }}
                    className="text-xs text-red-500 hover:text-red-700 font-medium cursor-pointer"
                  >ล้างทั้งหมด</button>
                </div>
                <div className="space-y-2">
                  {batchProducts.map((p, i) => (
                    <button
                      key={`${p.barcode}-${i}`}
                      onClick={() => navigate(`/product/${p.barcode}`, { state: { product: p } })}
                      className="w-full flex items-center gap-3 p-2.5 hover:bg-gray-50 rounded-xl transition-all duration-150 cursor-pointer press-sm text-left border border-gray-100"
                    >
                      <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center flex-shrink-0 p-0.5 overflow-hidden border border-gray-100">
                        {p.image ? (
                          <img src={p.image} className="w-full h-full object-contain rounded-lg" />
                        ) : (
                          <span className="material-symbols-outlined text-gray-300">inventory_2</span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm text-gray-800 truncate">{p.name}</p>
                        <p className="text-[11px] text-gray-400 truncate">{p.brand || 'ไม่ระบุแบรนด์'}</p>
                      </div>
                      <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-xs font-black flex-shrink-0 ${gradeColorClasses(p.grade)}`}>
                        {p.grade}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Loading skeleton */}
            {loading && !isBatchMode && <SkeletonCard />}

            {/* Error state */}
            {error && !loading && (
              <div className="card p-4 border border-red-100 bg-red-50 animate-fadeUp">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center flex-shrink-0">
                    <span className="material-symbols-outlined text-red-500">search_off</span>
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-red-700">ไม่พบสินค้า</p>
                    <p className="text-sm text-red-500 mt-0.5 whitespace-pre-line leading-relaxed">{error}</p>
                    <button
                      onClick={() => setManualCode('')}
                      className="mt-2 text-sm text-red-600 font-semibold underline underline-offset-2 cursor-pointer hover:text-red-700 transition-colors"
                    >
                      ลองใหม่
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Manual barcode input with live validation */}
            <div className="card p-5 animate-fadeUp delay-100">
              <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary-500 text-lg">keyboard</span>
                ป้อนบาร์โค้ดด้วยตนเอง
              </h3>
              <form onSubmit={handleManualSearch}>
                <div className="flex gap-2">
                  <div className="flex-1 relative">
                    <input
                      type="text"
                      value={manualCode}
                      onChange={e => setManualCode(e.target.value.replace(/\D/g, '').slice(0, 14))}
                      placeholder="เช่น 8850006190284"
                      className={`input-field w-full pr-10 transition-all duration-300 ${
                        manualCode.length >= 8
                          ? isValidInput ? 'border-green-400 focus:ring-green-200' : 'border-yellow-400 focus:ring-yellow-200'
                          : ''
                      }`}
                      inputMode="numeric"
                      autoComplete="off"
                      aria-label="บาร์โค้ดสินค้า"
                    />
                    {manualCode && (
                      <button
                        type="button"
                        onClick={() => setManualCode('')}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer transition-colors"
                      >
                        <span className="material-symbols-outlined text-lg">close</span>
                      </button>
                    )}
                  </div>
                  <button
                    type="submit"
                    disabled={loading || !manualCode.trim()}
                    aria-label="ค้นหา"
                    className="btn-primary px-4 disabled:opacity-40 cursor-pointer"
                  >
                    {loading ? (
                      <div className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    ) : (
                      <span className="material-symbols-outlined">search</span>
                    )}
                  </button>
                </div>

                {/* Live validation feedback */}
                <BarcodeInputFeedback code={manualCode} />

                <p className="text-xs text-gray-400 mt-2 flex items-center gap-1">
                  <span className="material-symbols-outlined text-[14px]">info</span>
                  กรอกเลข 8–13 หลักที่อยู่ใต้บาร์โค้ด (ตัวเลขเท่านั้น)
                </p>
              </form>
            </div>
          </div>

          {/* ── RIGHT: Demo products + Featured ── */}
          <div className="space-y-5">

            {/* Demo scan items — with real pre-fetched images + grades */}
            <div className="card p-5 animate-fadeUp delay-150">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-gray-800 flex items-center gap-2">
                  <span className="material-symbols-outlined text-green-500 text-lg">experiment</span>
                  ทดลองสแกนสินค้า
                </h3>
                <div className="flex items-center gap-1.5">
                  <span className={`w-1.5 h-1.5 rounded-full ${prefetchDone ? 'bg-green-400' : 'bg-yellow-400 animate-pulse'}`} />
                  <span className={`chip text-[11px] ${prefetchDone ? 'bg-green-50 text-green-700 border-green-200' : 'bg-yellow-50 text-yellow-700 border-yellow-200'}`}>
                    {prefetchDone ? `โหลดแล้ว ${prefetched.size}/${DEMO_SCAN_ITEMS.length}` : 'กำลังโหลด...'}
                  </span>
                </div>
              </div>
              <p className="text-xs text-gray-400 mb-3">ดึงข้อมูลจริงจาก Open Food Facts · คลิกเพื่อดูรายละเอียดเต็ม</p>
              <div className="space-y-1.5">
                {DEMO_SCAN_ITEMS.map((item, i) => {
                  const prefetchedProduct = prefetched.get(item.code);
                  const isActive = activeDemo === item.code;
                  const grade    = prefetchedProduct ? applyHealthGoals(prefetchedProduct, healthGoals).grade : undefined;

                  return (
                    <button
                      key={item.code}
                      onClick={() => handleDemoScan(item.code)}
                      disabled={loading}
                      className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all duration-200 cursor-pointer press-sm text-left group
                        ${isActive ? 'bg-primary-50 border border-primary-200 shadow-sm' : 'bg-gray-50 hover:bg-primary-50 hover:shadow-sm border border-transparent hover:border-primary-100'}
                        disabled:opacity-50`}
                      style={{ animationDelay: `${i * 35}ms` }}
                    >
                      {/* Product image or category icon */}
                      <div className={`w-10 h-10 rounded-xl overflow-hidden flex-shrink-0 flex items-center justify-center transition-all duration-200 ${
                        isActive ? 'bg-primary-100' : 'bg-white border border-gray-100 group-hover:border-primary-200'
                      }`}>
                        {prefetchedProduct?.image ? (
                          <img
                            src={prefetchedProduct.image}
                            alt={item.name}
                            className="w-full h-full object-contain"
                            loading="lazy"
                          />
                        ) : (
                          <span className={`material-symbols-outlined text-base transition-colors ${
                            isActive ? 'text-primary-500' : 'text-gray-400 group-hover:text-primary-400'
                          }`}>
                            {CATEGORY_ICONS[item.category] ?? CATEGORY_ICONS.default}
                          </span>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm text-gray-800 truncate">{item.name}</p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="text-xs text-gray-400 truncate">{item.brand}</span>
                          <CountryBadge code={item.countryCode} />
                        </div>
                      </div>

                      {/* Grade badge (from prefetched data) or spinner */}
                      {isActive || (loading && manualCode === item.code) ? (
                        <div className="w-5 h-5 border-2 border-primary-400 border-t-transparent rounded-full animate-spin flex-shrink-0" />
                      ) : grade ? (
                        <div className={`w-8 h-8 rounded-xl border-2 flex items-center justify-center text-xs font-black flex-shrink-0 transition-transform duration-200 group-hover:scale-105 ${gradeColorClasses(grade) ?? ''}`}>
                          {grade}
                        </div>
                      ) : (
                        <span className="material-symbols-outlined text-gray-300 text-sm flex-shrink-0 group-hover:text-primary-400 transition-colors">chevron_right</span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Featured products (live from Open Food Facts) */}
            <div className="card p-5 animate-fadeUp delay-200">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-gray-800 flex items-center gap-2">
                  <span className="material-symbols-outlined text-yellow-500 text-lg">star</span>
                  สินค้ายอดนิยม
                </h3>
                <div className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                  <span className="text-xs text-green-600 font-semibold">Live</span>
                </div>
              </div>
              <div className="space-y-1.5">
                {featuredLoading ? (
                  [1,2,3,4].map(i => (
                    <div key={i} className="flex items-center gap-3 p-2.5" style={{ animationDelay: `${i * 60}ms` }}>
                      <div className="w-12 h-12 rounded-xl skeleton flex-shrink-0" />
                      <div className="flex-1 space-y-2">
                        <div className="h-2.5 w-16 skeleton rounded-full" />
                        <div className="h-3.5 w-32 skeleton rounded-full" />
                      </div>
                      <div className="w-8 h-8 rounded-full skeleton flex-shrink-0" />
                    </div>
                  ))
                ) : (
                  featuredProducts.map((p, i) => (
                    <button
                      key={p.barcode}
                      onClick={() => navigate(`/product/${p.barcode}`, { state: { product: p } })}
                      className="w-full flex items-center gap-3 p-2.5 hover:bg-gray-50 rounded-xl transition-all duration-150 cursor-pointer press-sm text-left group"
                      style={{ animationDelay: `${i * 40}ms` }}
                    >
                      <div className="w-12 h-12 rounded-xl bg-gray-50 overflow-hidden flex-shrink-0 flex items-center justify-center border border-gray-100 group-hover:border-primary-200 transition-colors">
                        {p.image ? (
                          <img src={p.image} alt={p.name} className="w-full h-full object-contain" loading="lazy" />
                        ) : (
                          <span className="material-symbols-outlined text-gray-300 text-xl">inventory_2</span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0 text-left">
                        <p className="text-[11px] text-gray-400">{p.brand}</p>
                        <p className="font-semibold text-sm text-gray-800 truncate">{p.name}</p>
                      </div>
                      <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-xs font-black flex-shrink-0 transition-transform duration-200 group-hover:scale-110 ${gradeColorClasses(p.grade) ?? ''}`}>
                        {p.grade}
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
