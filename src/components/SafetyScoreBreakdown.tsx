/**
 * SafetyScoreBreakdown — Visual breakdown of how the safety score was calculated
 *
 * Shows every factor that contributed positively or negatively to the score,
 * so users understand WHY a product got its grade.
 */

import { useState, useEffect } from 'react';
import type { Product } from '../types';

interface ScoreContributor {
  label:       string;
  value:       number;   // positive = bonus, negative = penalty
  icon:        string;
  description: string;
}

function buildContributors(product: Product): ScoreContributor[] {
  const list: ScoreContributor[] = [];
  const n = product.nutrition;

  // Nutriscore
  if (product.nutriscoreScore !== undefined) {
    const grades = ['e','d','c','b','a'];
    const grade  = grades[product.nutriscoreScore - 1]?.toUpperCase() ?? '?';
    const values: Record<string, number> = { A: 18, B: 10, C: 2, D: -10, E: -18 };
    const v = values[grade] ?? 0;
    list.push({
      label: `Nutri-score ${grade}`,
      value: v,
      icon:  v >= 0 ? 'thumb_up' : 'thumb_down',
      description: v >= 0
        ? 'คุณค่าทางโภชนาการดี (ต่ำน้ำตาล/เกลือ/ไขมันอิ่มตัว, สูงโปรตีน/ใยอาหาร)'
        : 'คุณค่าทางโภชนาการต่ำ (สูงน้ำตาล/เกลือ/ไขมัน)',
    });
  }

  // NOVA group
  if (product.novaGroup !== undefined) {
    const novaValues: Record<number, number> = { 1: 10, 2: 5, 3: -5, 4: -10 };
    const novaLabels: Record<number, string> = {
      1: 'ไม่แปรรูป',
      2: 'แปรรูปน้อย',
      3: 'แปรรูปพอสมควร',
      4: 'Ultra-processed',
    };
    const v = novaValues[product.novaGroup] ?? 0;
    list.push({
      label: `NOVA ${product.novaGroup} — ${novaLabels[product.novaGroup]}`,
      value: v,
      icon:  'factory',
      description: v >= 0
        ? 'ระดับการแปรรูปอาหารต่ำ ส่วนผสมใกล้เคียงธรรมชาติ'
        : 'อาหารที่ผ่านกระบวนการอุตสาหกรรมสูง มีสารเติมแต่งหลายชนิด',
    });
  }

  // Risk additives
  const riskAdditives = (product.additives ?? []).filter(a => a.severity === 'risk');
  if (riskAdditives.length > 0) {
    list.push({
      label: `วัตถุเจือปนความเสี่ยงสูง ${riskAdditives.length} รายการ`,
      value: -(riskAdditives.length * 8),
      icon:  'dangerous',
      description: `พบ: ${riskAdditives.map(a => a.code).join(', ')}`,
    });
  }

  // Caution additives
  const cautionAdditives = (product.additives ?? []).filter(a => a.severity === 'caution');
  if (cautionAdditives.length > 0) {
    list.push({
      label: `วัตถุเจือปนควรระวัง ${cautionAdditives.length} รายการ`,
      value: -(cautionAdditives.length * 3),
      icon:  'warning',
      description: `พบ: ${cautionAdditives.slice(0, 5).map(a => a.code).join(', ')}${cautionAdditives.length > 5 ? '...' : ''}`,
    });
  }

  // Risk ingredients
  const riskIngredients = product.ingredients.filter(i => i.status === 'risk');
  if (riskIngredients.length > 0) {
    list.push({
      label: `ส่วนผสมเสี่ยง ${riskIngredients.length} รายการ`,
      value: -(riskIngredients.length * 5),
      icon:  'science',
      description: `เช่น: ${riskIngredients.slice(0, 3).map(i => i.name).join(', ')}`,
    });
  }

  // Trans fat
  if (n.transFat && n.transFat > 0.5) {
    list.push({
      label: `ไขมันทรานส์ ${n.transFat.toFixed(1)}g`,
      value: -10,
      icon:  'heart_broken',
      description: 'ไขมันทรานส์สูง เพิ่มความเสี่ยงโรคหัวใจ WHO แนะนำ <0.5g/วัน',
    });
  }

  // High sugar
  if (n.sugar > 20) {
    list.push({
      label: `น้ำตาลสูง ${n.sugar.toFixed(1)}g/100g`,
      value: -8,
      icon:  'cake',
      description: 'น้ำตาลเกิน 20g/100g เพิ่มความเสี่ยงโรคเบาหวาน ฟันผุ น้ำหนักเกิน',
    });
  } else if (n.sugar > 10) {
    list.push({
      label: `น้ำตาลค่อนข้างสูง ${n.sugar.toFixed(1)}g/100g`,
      value: -4,
      icon:  'cake',
      description: 'น้ำตาล 10–20g/100g อยู่ในระดับปานกลาง-สูง',
    });
  }

  // High sodium
  const sodiumMg = n.sodium * 1000;
  if (sodiumMg > 1500) {
    list.push({
      label: `โซเดียมสูง ${sodiumMg.toFixed(0)}mg/100g`,
      value: -8,
      icon:  'water_drop',
      description: 'โซเดียมสูงมาก เสี่ยงความดันโลหิตสูง โรคไต ภาวะบวมน้ำ',
    });
  } else if (sodiumMg > 600) {
    list.push({
      label: `โซเดียมปานกลาง ${sodiumMg.toFixed(0)}mg/100g`,
      value: -4,
      icon:  'water_drop',
      description: 'โซเดียม 600–1500mg/100g ควรระวังการบริโภคสะสม',
    });
  }

  // High saturated fat
  if (n.saturatedFat > 15) {
    list.push({
      label: `ไขมันอิ่มตัวสูง ${n.saturatedFat.toFixed(1)}g/100g`,
      value: -6,
      icon:  'heart_broken',
      description: 'ไขมันอิ่มตัวสูง เพิ่ม LDL cholesterol และความเสี่ยงโรคหัวใจ',
    });
  }

  // High fiber (bonus)
  if (n.fiber > 6) {
    list.push({
      label: `ใยอาหารสูง ${n.fiber.toFixed(1)}g/100g`,
      value: 6,
      icon:  'eco',
      description: 'ใยอาหารสูง ดีต่อระบบย่อยอาหาร ลดคอเลสเตอรอล และควบคุมน้ำตาล',
    });
  } else if (n.fiber > 3) {
    list.push({
      label: `ใยอาหารพอสมควร ${n.fiber.toFixed(1)}g/100g`,
      value: 3,
      icon:  'eco',
      description: 'มีใยอาหารในระดับดี',
    });
  }

  // Organic label
  if (product.isOrganic) {
    list.push({
      label: 'ออร์แกนิคที่ผ่านการรับรอง',
      value: 5,
      icon:  'verified',
      description: 'ผลิตโดยไม่ใช้ยาฆ่าแมลงหรือปุ๋ยเคมีสังเคราะห์',
    });
  }

  // Eco-score bonus/penalty
  if (product.ecoGrade === 'a' || product.ecoGrade === 'b') {
    list.push({
      label: `Eco-score ${product.ecoGrade.toUpperCase()} — ผลกระทบสิ่งแวดล้อมต่ำ`,
      value: 3,
      icon:  'forest',
      description: 'กระบวนการผลิตมีผลกระทบต่อสิ่งแวดล้อมต่ำ',
    });
  } else if (product.ecoGrade === 'e') {
    list.push({
      label: 'Eco-score E — ผลกระทบสิ่งแวดล้อมสูงมาก',
      value: -3,
      icon:  'co2',
      description: 'ฝีเท้าคาร์บอนสูง การผลิตทำลายสิ่งแวดล้อม',
    });
  }

  return list;
}

interface Props {
  product: Product;
}

// ── Animated progress bar for contributors ───────────────────────────────────
function AnimatedBar({ width, isPositive }: { width: number; isPositive: boolean }) {
  const [displayWidth, setDisplayWidth] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setDisplayWidth(width), 120);
    return () => clearTimeout(t);
  }, [width]);

  return (
    <div className={`h-full rounded-full ${isPositive ? 'bg-green-500' : 'bg-red-400'}`}
      style={{ width: `${displayWidth}%`, transition: 'width 0.7s cubic-bezier(0.22,1,0.36,1)' }}
    />
  );
}

export function SafetyScoreBreakdown({ product }: Props) {
  const contributors = buildContributors(product);
  const base         = 65;
  const totalBonus   = contributors.filter(c => c.value > 0).reduce((s, c) => s + c.value, 0);
  const totalPenalty = contributors.filter(c => c.value < 0).reduce((s, c) => s + c.value, 0);

  return (
    <div className="space-y-3">
      {/* Score arithmetic summary */}
      <div className="flex items-center justify-between bg-gray-50 rounded-2xl p-4 text-sm">
        <div className="text-center">
          <p className="text-xs text-gray-400 mb-0.5">คะแนนเริ่มต้น</p>
          <p className="text-xl font-black text-gray-600">{base}</p>
        </div>
        <div className="text-center">
          <p className="text-xs text-gray-400 mb-0.5">โบนัส</p>
          <p className="text-xl font-black text-green-600">+{totalBonus}</p>
        </div>
        <div className="text-center">
          <p className="text-xs text-gray-400 mb-0.5">หัก</p>
          <p className="text-xl font-black text-red-500">{totalPenalty}</p>
        </div>
        <div className="text-center border-l border-gray-200 pl-4">
          <p className="text-xs text-gray-400 mb-0.5">รวม</p>
          <p className={`text-xl font-black ${
            product.safetyScore >= 85 ? 'text-green-600' :
            product.safetyScore >= 70 ? 'text-lime-600' :
            product.safetyScore >= 55 ? 'text-yellow-600' :
            product.safetyScore >= 40 ? 'text-orange-600' : 'text-red-600'
          }`}>{product.safetyScore}</p>
        </div>
      </div>

      {/* Contributors list */}
      {contributors.length > 0 ? (
        <div className="space-y-2">
          {contributors.map((c, i) => {
            const isPositive = c.value > 0;
            const absVal     = Math.abs(c.value);
            const maxVal     = 20;
            const barWidth   = Math.min((absVal / maxVal) * 100, 100);

            return (
              <div
                key={i}
                className={`rounded-2xl border p-3.5 ${
                  isPositive ? 'bg-green-50 border-green-100' : 'bg-red-50 border-red-100'
                }`}
                style={{ animationDelay: `${i * 40}ms` }}
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className={`material-symbols-outlined text-sm flex-shrink-0 ${
                      isPositive ? 'text-green-600' : 'text-red-500'
                    }`}>{c.icon}</span>
                    <span className="text-sm font-semibold text-gray-800 leading-snug">{c.label}</span>
                  </div>
                  <span className={`text-sm font-black flex-shrink-0 ${
                    isPositive ? 'text-green-700' : 'text-red-600'
                  }`}>
                    {isPositive ? '+' : ''}{c.value}
                  </span>
                </div>
                {/* Mini progress bar */}
                <div className="w-full bg-white/60 rounded-full h-1.5 mb-2 overflow-hidden">
                  <AnimatedBar width={barWidth} isPositive={isPositive} />
                </div>
                <p className="text-xs text-gray-500 leading-relaxed">{c.description}</p>
              </div>
            );
          })}
        </div>
      ) : (
        <p className="text-sm text-gray-400 text-center py-4">
          ไม่มีปัจจัยพิเศษที่ส่งผลต่อคะแนน
        </p>
      )}

      <p className="text-xs text-gray-300 text-center">
        คะแนนจำกัดระหว่าง 10–100 · อ้างอิง: EFSA, FDA, IARC, WHO/JECFA
      </p>
    </div>
  );
}
