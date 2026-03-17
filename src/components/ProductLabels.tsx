/**
 * ProductLabels — Certification and label badge strip
 *
 * Renders icon+text badges for: organic, vegan, vegetarian, halal, kosher,
 * gluten-free, fair-trade, palm-oil-free, etc.
 */

import type { Product } from '../types';
import { getAllergenIcon } from '../lib/utils';

interface LabelConfig {
  key:    keyof Product;
  icon:   string;
  label:  string;
  bg:     string;
  text:   string;
  border: string;
}

const LABEL_CONFIGS: LabelConfig[] = [
  { key: 'isOrganic',    icon: 'eco',              label: 'ออร์แกนิค',        bg: 'bg-green-50',  text: 'text-green-700',  border: 'border-green-200'  },
  { key: 'isVegan',      icon: 'spa',              label: 'วีแกน',             bg: 'bg-lime-50',   text: 'text-lime-700',   border: 'border-lime-200'   },
  { key: 'isVegetarian', icon: 'nature',           label: 'มังสวิรัติ',        bg: 'bg-emerald-50',text: 'text-emerald-700',border: 'border-emerald-200'},
  { key: 'isGlutenFree', icon: 'no_food',          label: 'ไม่มีกลูเตน',      bg: 'bg-amber-50',  text: 'text-amber-700',  border: 'border-amber-200'  },
  { key: 'isHalal',      icon: 'verified',         label: 'ฮาลาล',            bg: 'bg-teal-50',   text: 'text-teal-700',   border: 'border-teal-200'   },
  { key: 'isKosher',     icon: 'verified_user',    label: 'โคเชอร์',          bg: 'bg-blue-50',   text: 'text-blue-700',   border: 'border-blue-200'   },
  { key: 'isFairTrade',  icon: 'handshake',        label: 'Fair Trade',        bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' },
  { key: 'isPalmOilFree',icon: 'forest',           label: 'ไม่มีปาล์มออยล์',  bg: 'bg-green-50',  text: 'text-green-700',  border: 'border-green-200'  },
];

interface ProductLabelsProps {
  product: Product;
  /** If true, show compact single-line scroll strip */
  compact?: boolean;
}

export function ProductLabels({ product, compact = false }: ProductLabelsProps) {
  const activeLabels = LABEL_CONFIGS.filter(cfg => product[cfg.key] === true);

  if (activeLabels.length === 0) return null;

  if (compact) {
    return (
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
        {activeLabels.map(cfg => (
          <span
            key={cfg.key as string}
            className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-semibold ${cfg.bg} ${cfg.text} ${cfg.border}`}
          >
            <span className="material-symbols-outlined text-sm">{cfg.icon}</span>
            {cfg.label}
          </span>
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-wrap gap-2">
      {activeLabels.map(cfg => (
        <div
          key={cfg.key as string}
          className={`flex items-center gap-2 px-3 py-2 rounded-2xl border ${cfg.bg} ${cfg.border}`}
        >
          <span className={`material-symbols-outlined text-base ${cfg.text}`}>{cfg.icon}</span>
          <span className={`text-sm font-semibold ${cfg.text}`}>{cfg.label}</span>
        </div>
      ))}
    </div>
  );
}

// ── Allergen chip strip ───────────────────────────────────────────────────────
interface AllergenChipsProps {
  allergens: string[];
  traces?:   string[];
}

export function AllergenChips({ allergens, traces }: AllergenChipsProps) {
  if (!allergens?.length && !traces?.length) return null;

  return (
    <div className="space-y-2">
      {allergens.length > 0 && (
        <div>
          <p className="text-xs font-bold text-red-600 mb-1.5 flex items-center gap-1">
            <span className="material-symbols-outlined text-sm">warning</span>
            สารก่อภูมิแพ้
          </p>
          <div className="flex flex-wrap gap-1.5">
            {allergens.map((a, i) => (
              <span
                key={i}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 border border-red-200 rounded-full text-xs font-semibold text-red-700"
              >
                <span className="material-symbols-outlined text-sm">{getAllergenIcon(a)}</span>
                {a}
              </span>
            ))}
          </div>
        </div>
      )}
      {traces && traces.length > 0 && (
        <div>
          <p className="text-xs font-bold text-orange-600 mb-1.5 flex items-center gap-1">
            <span className="material-symbols-outlined text-sm">info</span>
            อาจมีร่องรอย
          </p>
          <div className="flex flex-wrap gap-1.5">
            {traces.map((t, i) => (
              <span
                key={i}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-50 border border-orange-200 rounded-full text-xs font-medium text-orange-700"
              >
                {t}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Data source badge ─────────────────────────────────────────────────────────
interface DataSourceBadgeProps {
  source?: Product['dataSource'];
  complete?: boolean;
}

const SOURCE_INFO: Record<string, { label: string; color: string; icon: string }> = {
  openfoodfacts:    { label: 'Open Food Facts',      color: 'text-green-600',  icon: 'restaurant' },
  openbeautyfacts:  { label: 'Open Beauty Facts',    color: 'text-pink-600',   icon: 'face' },
  openpetfoodfacts: { label: 'Open Pet Food Facts',  color: 'text-amber-600',  icon: 'pets' },
  unknown:          { label: 'ไม่ทราบแหล่งข้อมูล',   color: 'text-gray-500',   icon: 'help' },
};

export function DataSourceBadge({ source, complete }: DataSourceBadgeProps) {
  const info = source ? SOURCE_INFO[source] : SOURCE_INFO.unknown;

  return (
    <div className="flex items-center gap-2 text-xs text-gray-400">
      <span className={`material-symbols-outlined text-sm ${info.color}`}>{info.icon}</span>
      <span>แหล่งข้อมูล: <span className={`font-semibold ${info.color}`}>{info.label}</span></span>
      {complete !== undefined && (
        <span className={`flex items-center gap-0.5 ${complete ? 'text-green-500' : 'text-gray-300'}`}>
          <span className="material-symbols-outlined text-sm">
            {complete ? 'check_circle' : 'radio_button_unchecked'}
          </span>
          {complete ? 'ข้อมูลครบถ้วน' : 'ข้อมูลบางส่วน'}
        </span>
      )}
    </div>
  );
}
