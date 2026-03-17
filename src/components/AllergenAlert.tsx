/**
 * AllergenAlert — Auto-triggered modal when product allergens match user's profile
 *
 * Shows immediately when a scanned product contains allergens the user has
 * flagged in their profile settings.
 */

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Product } from '../types';
import { useAuth } from '../context/AuthContext';
import { getAllergenIcon } from '../lib/utils';

interface Props {
  product: Product;
}

export function AllergenAlert({ product }: Props) {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [show, setShow] = useState(false);
  const [matchedAllergens, setMatchedAllergens] = useState<string[]>([]);

  useEffect(() => {
    if (!profile?.allergens?.length || !product.allergens?.length) return;

    // Cross-reference product allergens vs user's declared allergens
    const userAllergens = profile.allergens.map((a: string) => a.toLowerCase());
    const productAllergens = product.allergens.map(a => a.toLowerCase());

    const matched = product.allergens.filter(pa => {
      const lc = pa.toLowerCase();
      return userAllergens.some(ua => lc.includes(ua) || ua.includes(lc.split(' ')[0]));
    });

    // Also check traces
    const tracesMatched = (product.traces ?? []).filter(t => {
      const lc = t.toLowerCase();
      return userAllergens.some(ua => lc.includes(ua) || ua.includes(lc));
    });

    const all = [...new Set([...matched, ...tracesMatched])];

    if (all.length > 0) {
      setMatchedAllergens(all);
      // Small delay so the page renders before modal appears
      const t = setTimeout(() => setShow(true), 600);
      return () => clearTimeout(t);
    }
  }, [product.barcode, profile?.allergens]);

  if (!show) return null;

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-5 bg-black/60 backdrop-blur-sm animate-fadeIn"
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="allergen-title"
    >
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm animate-scaleIn overflow-hidden">
        {/* Red header */}
        <div className="bg-gradient-to-br from-red-500 to-orange-500 p-6 text-white text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16" />
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full -ml-12 -mb-12" />
          <div className="relative z-10">
            <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center mx-auto mb-3 animate-wiggle">
              <span className="material-symbols-outlined text-white text-4xl animate-beat">warning</span>
            </div>
            <h2 id="allergen-title" className="text-xl font-black mb-1">ตรวจพบสารก่อภูมิแพ้!</h2>
            <p className="text-sm text-white/90">สินค้านี้มีสารที่คุณแพ้อยู่</p>
          </div>
        </div>

        {/* Body */}
        <div className="p-5">
          <p className="text-sm text-gray-600 mb-4 text-center">
            <span className="font-bold text-gray-800">{product.name}</span>
            {' '}มีส่วนประกอบที่ตรงกับรายการแพ้ของคุณ:
          </p>

          <div className="space-y-2 mb-5">
            {matchedAllergens.map((allergen, i) => (
              <div
                key={i}
                className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-2xl px-4 py-3 animate-fadeUp transition-all duration-200 hover:bg-red-100 hover:shadow-md"
                style={{ animationDelay: `${i * 80}ms` }}
              >
                <span className="material-symbols-outlined text-red-500 text-xl flex-shrink-0 transition-transform duration-200 hover:scale-110">
                  {getAllergenIcon(allergen)}
                </span>
                <span className="font-semibold text-red-800 text-sm">{allergen}</span>
              </div>
            ))}
          </div>

          {product.traces && product.traces.length > 0 && (
            <div className="bg-orange-50 border border-orange-200 rounded-2xl p-3 mb-4">
              <p className="text-xs text-orange-700">
                <span className="font-bold">อาจมีร่องรอย:</span>{' '}
                {product.traces.join(', ')}
              </p>
            </div>
          )}

          <p className="text-xs text-gray-400 text-center mb-4">
            แนะนำให้หลีกเลี่ยงสินค้านี้หรือปรึกษาแพทย์ก่อนรับประทาน
          </p>

          <div className="flex gap-2">
            <button
              onClick={() => { setShow(false); navigate(-1); }}
              className="flex-1 py-3 rounded-2xl bg-red-500 text-white font-bold text-sm press-effect hover:bg-red-600 hover:shadow-lg transition-all duration-200"
            >
              ย้อนกลับ
            </button>
            <button
              onClick={() => setShow(false)}
              className="flex-1 py-3 rounded-2xl bg-gray-100 text-gray-700 font-semibold text-sm press-effect hover:bg-gray-200 hover:shadow-md transition-all duration-200"
            >
              ดูข้อมูลต่อ
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
