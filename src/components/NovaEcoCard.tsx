/**
 * NovaEcoCard — NOVA food processing group + Eco-score display
 *
 * NOVA groups classify foods by level of industrial processing (1=unprocessed → 4=ultra-processed)
 * Eco-score rates environmental impact (A=best → E=worst)
 */

import type { NovaGroup, EcoGrade } from '../types';

// ── NOVA Group Data ───────────────────────────────────────────────────────────
const NOVA_DATA: Record<NovaGroup, {
  label:       string;
  shortLabel:  string;
  description: string;
  color:       string;
  bg:          string;
  border:      string;
  textColor:   string;
  examples:    string;
}> = {
  1: {
    label:      'อาหารไม่แปรรูป',
    shortLabel: 'ไม่แปรรูป',
    description: 'อาหารสดหรือแปรรูปน้อยมาก ไม่มีการเติมสารเพิ่มเติม เช่น การอบแห้ง หั่น หรือแช่แข็ง',
    color:      'bg-green-500',
    bg:         'bg-green-50',
    border:     'border-green-200',
    textColor:  'text-green-700',
    examples:   'ผักสด ผลไม้ เนื้อสัตว์ ไข่ นมสด',
  },
  2: {
    label:      'ส่วนผสมอาหาร',
    shortLabel: 'แปรรูปน้อย',
    description: 'ส่วนผสมที่ผ่านการแปรรูปเล็กน้อย ได้จากอาหารกลุ่ม 1 เพื่อใช้ปรุงอาหาร',
    color:      'bg-lime-500',
    bg:         'bg-lime-50',
    border:     'border-lime-200',
    textColor:  'text-lime-700',
    examples:   'น้ำมันพืช แป้ง น้ำตาล เกลือ น้ำผึ้ง',
  },
  3: {
    label:      'อาหารแปรรูป',
    shortLabel: 'แปรรูป',
    description: 'อาหารที่ผ่านกระบวนการแปรรูปพื้นฐาน มีส่วนผสมเพิ่มเติมเพื่อถนอมอาหารหรือรสชาติ',
    color:      'bg-yellow-500',
    bg:         'bg-yellow-50',
    border:     'border-yellow-200',
    textColor:  'text-yellow-700',
    examples:   'ชีส แฮม ผักดอง ผลไม้กระป๋อง ถั่วอบเกลือ',
  },
  4: {
    label:      'อาหารแปรรูปขั้นสูง',
    shortLabel: 'ประมวลผลสูงมาก',
    description: 'อาหารที่ผ่านกระบวนการอุตสาหกรรม มีสารเติมแต่งมาก เช่น สีผสมอาหาร รสประดิษฐ์ สารกันบูด',
    color:      'bg-red-500',
    bg:         'bg-red-50',
    border:     'border-red-200',
    textColor:  'text-red-700',
    examples:   'ขนมขบเคี้ยว ไส้กรอกอุตสาหกรรม อาหารสำเร็จรูป เครื่องดื่มรสผลไม้',
  },
};

// ── Eco-score Data ────────────────────────────────────────────────────────────
const ECO_DATA: Record<EcoGrade, {
  label:       string;
  description: string;
  color:       string;
  bg:          string;
  border:      string;
  textColor:   string;
  score:       string;
}> = {
  a: {
    label:       'ดีเยี่ยม',
    description: 'ผลกระทบต่อสิ่งแวดล้อมต่ำมาก ผลิตอย่างยั่งยืน',
    color:       'bg-green-600',
    bg:          'bg-green-50',
    border:      'border-green-200',
    textColor:   'text-green-700',
    score:       '> 80',
  },
  b: {
    label:       'ดี',
    description: 'ผลกระทบต่อสิ่งแวดล้อมค่อนข้างต่ำ',
    color:       'bg-lime-500',
    bg:          'bg-lime-50',
    border:      'border-lime-200',
    textColor:   'text-lime-700',
    score:       '61–80',
  },
  c: {
    label:       'ปานกลาง',
    description: 'ผลกระทบต่อสิ่งแวดล้อมปานกลาง',
    color:       'bg-yellow-500',
    bg:          'bg-yellow-50',
    border:      'border-yellow-200',
    textColor:   'text-yellow-700',
    score:       '41–60',
  },
  d: {
    label:       'ต่ำ',
    description: 'ผลกระทบต่อสิ่งแวดล้อมค่อนข้างสูง',
    color:       'bg-orange-500',
    bg:          'bg-orange-50',
    border:      'border-orange-200',
    textColor:   'text-orange-700',
    score:       '21–40',
  },
  e: {
    label:       'แย่มาก',
    description: 'ผลกระทบต่อสิ่งแวดล้อมสูงมาก',
    color:       'bg-red-600',
    bg:          'bg-red-50',
    border:      'border-red-200',
    textColor:   'text-red-700',
    score:       '≤ 20',
  },
};

// ── NOVA Card ─────────────────────────────────────────────────────────────────
interface NovaCardProps {
  novaGroup: NovaGroup;
  compact?: boolean;
}

export function NovaCard({ novaGroup, compact = false }: NovaCardProps) {
  const data = NOVA_DATA[novaGroup];
  if (!data) return null;

  if (compact) {
    return (
      <div className={`flex items-center gap-2 px-3 py-2 rounded-xl border ${data.bg} ${data.border}`}>
        <div className={`w-6 h-6 rounded-lg ${data.color} flex items-center justify-center flex-shrink-0`}>
          <span className="text-white text-xs font-black">{novaGroup}</span>
        </div>
        <div>
          <p className="text-xs font-bold text-gray-700">NOVA {novaGroup}</p>
          <p className={`text-[10px] ${data.textColor}`}>{data.shortLabel}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`rounded-2xl border p-4 ${data.bg} ${data.border}`}>
      <div className="flex items-center gap-3 mb-2">
        <div className={`w-10 h-10 rounded-xl ${data.color} flex items-center justify-center flex-shrink-0 shadow-sm`}>
          <span className="text-white text-lg font-black">{novaGroup}</span>
        </div>
        <div>
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">NOVA Group {novaGroup}</p>
          <p className={`font-bold text-sm ${data.textColor}`}>{data.label}</p>
        </div>
      </div>
      <p className="text-xs text-gray-600 leading-relaxed mb-2">{data.description}</p>
      <p className="text-xs text-gray-400">ตัวอย่าง: {data.examples}</p>
    </div>
  );
}

// ── Eco-score Card ────────────────────────────────────────────────────────────
interface EcoCardProps {
  ecoGrade:  EcoGrade;
  ecoScore?: number;
  compact?:  boolean;
}

export function EcoCard({ ecoGrade, ecoScore, compact = false }: EcoCardProps) {
  const data = ECO_DATA[ecoGrade];
  if (!data) return null;

  if (compact) {
    return (
      <div className={`flex items-center gap-2 px-3 py-2 rounded-xl border ${data.bg} ${data.border}`}>
        <div className={`w-6 h-6 rounded-lg ${data.color} flex items-center justify-center flex-shrink-0`}>
          <span className="text-white text-xs font-black">{ecoGrade.toUpperCase()}</span>
        </div>
        <div>
          <p className="text-xs font-bold text-gray-700">Eco-score</p>
          <p className={`text-[10px] ${data.textColor}`}>{data.label}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`rounded-2xl border p-4 ${data.bg} ${data.border}`}>
      <div className="flex items-center gap-3 mb-2">
        <div className={`w-10 h-10 rounded-xl ${data.color} flex items-center justify-center flex-shrink-0 shadow-sm`}>
          <span className="text-white text-lg font-black">{ecoGrade.toUpperCase()}</span>
        </div>
        <div>
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">
            Eco-score {ecoScore !== undefined ? `(${ecoScore}/100)` : ''}
          </p>
          <p className={`font-bold text-sm ${data.textColor}`}>{data.label}</p>
        </div>
      </div>
      <p className="text-xs text-gray-600 leading-relaxed">{data.description}</p>
    </div>
  );
}

// ── Nutriscore Badge ──────────────────────────────────────────────────────────
interface NutriScoreProps {
  grade: string; // 'a'|'b'|'c'|'d'|'e'
  compact?: boolean;
}

const NUTRI_COLORS: Record<string, { bg: string; label: string; desc: string }> = {
  a: { bg: 'bg-green-600',  label: 'ดีมาก',     desc: 'โภชนาการดีเยี่ยม' },
  b: { bg: 'bg-lime-500',   label: 'ดี',         desc: 'โภชนาการดี' },
  c: { bg: 'bg-yellow-500', label: 'ปานกลาง',   desc: 'โภชนาการปานกลาง' },
  d: { bg: 'bg-orange-500', label: 'ต่ำ',        desc: 'โภชนาการต่ำ' },
  e: { bg: 'bg-red-600',    label: 'แย่มาก',    desc: 'โภชนาการแย่' },
};

const NUTRI_GRADES: Array<'a'|'b'|'c'|'d'|'e'> = ['a','b','c','d','e'];

export function NutriScoreBadge({ grade, compact = false }: NutriScoreProps) {
  const lc   = grade.toLowerCase() as keyof typeof NUTRI_COLORS;
  const data = NUTRI_COLORS[lc];
  if (!data) return null;

  if (compact) {
    return (
      <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-xl px-3 py-2">
        <span className="text-xs font-bold text-gray-500 mr-1">Nutri-score</span>
        {NUTRI_GRADES.map(g => (
          <div
            key={g}
            className={`h-5 flex items-center justify-center rounded text-white font-black text-[11px] transition-all
              ${g === lc ? `${NUTRI_COLORS[g].bg} w-7 shadow-sm` : `${NUTRI_COLORS[g].bg} w-5 opacity-30`}`}
          >
            {g.toUpperCase()}
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-4">
      <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Nutri-score</p>
      <div className="flex items-end gap-1 mb-3">
        {NUTRI_GRADES.map(g => (
          <div
            key={g}
            className={`flex items-center justify-center rounded-lg text-white font-black transition-all
              ${g === lc
                ? `${NUTRI_COLORS[g].bg} w-12 h-12 text-xl shadow-md`
                : `${NUTRI_COLORS[g].bg} w-8 h-8 text-sm opacity-25`
              }`}
          >
            {g.toUpperCase()}
          </div>
        ))}
      </div>
      <p className="font-bold text-gray-800">{data.label}</p>
      <p className="text-xs text-gray-500 mt-0.5">{data.desc}</p>
    </div>
  );
}
