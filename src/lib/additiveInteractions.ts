/**
 * Additive Interaction Detection
 *
 * Detects dangerous chemical combinations when multiple additives appear
 * in the same product. Sources: EFSA, FDA, IARC, peer-reviewed literature.
 */

import type { Additive } from '../types';

export interface AdditiveInteraction {
  id:          string;
  severity:    'critical' | 'high' | 'medium';
  title:       string;
  description: string;
  icon:        string;
  codes:       string[];    // which additive codes triggered this
  reference:   string;      // scientific reference / source
}

// ── Interaction Rules ─────────────────────────────────────────────────────────

interface InteractionRule {
  id:          string;
  severity:    'critical' | 'high' | 'medium';
  title:       string;
  description: string;
  icon:        string;
  reference:   string;
  /** Returns triggering codes if rule fires, null if it doesn't apply */
  detect:      (presentCodes: Set<string>) => string[] | null;
}

const BENZOATES  = ['E210', 'E211', 'E212', 'E213'];
const ASCORBATES = ['E300', 'E301', 'E302'];
const NITRITES   = ['E249', 'E250'];
const NITRATES   = ['E251', 'E252'];
const SOUTHAMPTON_6 = ['E102', 'E104', 'E110', 'E122', 'E124', 'E129'];
const SULPHITES  = ['E220', 'E221', 'E222', 'E223', 'E224', 'E226', 'E227', 'E228'];
const SYNTHETIC_ANTIOXIDANTS = ['E310', 'E311', 'E312', 'E319', 'E320', 'E321'];
const PHOSPHATES = ['E338', 'E339', 'E340', 'E341', 'E343'];

const RULES: InteractionRule[] = [

  // ── CRITICAL: Benzene formation ──────────────────────────────────────────
  {
    id:       'benzene',
    severity: 'critical',
    title:    'เบนซีน — สารก่อมะเร็ง (IARC Group 1)',
    description: 'พบเบนโซเอต (E210–E213) และวิตามิน C (E300–E302) ในผลิตภัณฑ์เดียวกัน ' +
      'ปฏิกิริยาระหว่างสองสารนี้สามารถผลิต benzene ได้ ซึ่ง IARC จัดให้เป็น ' +
      'สารก่อมะเร็งกลุ่ม 1 (confirmed human carcinogen) อัตราการเกิดสูงขึ้นเมื่อมีแสง/ความร้อน',
    icon:      'science',
    reference: 'Gardner & Lawrence (1993), FDA Benzene in Beverages (2006), IARC Monograph 100F',
    detect(codes) {
      const hasBenzoate  = BENZOATES.some(c  => codes.has(c));
      const hasAscorbate = ASCORBATES.some(c => codes.has(c));
      if (!hasBenzoate || !hasAscorbate) return null;
      return [...BENZOATES.filter(c => codes.has(c)), ...ASCORBATES.filter(c => codes.has(c))];
    },
  },

  // ── CRITICAL: Nitrosamine formation ──────────────────────────────────────
  {
    id:       'nitrosamine',
    severity: 'critical',
    title:    'ไนโตรซามีน — สารก่อมะเร็ง (IARC Group 2A)',
    description: 'พบสารไนไตรต์/ไนเตรต (E249–E252) ในผลิตภัณฑ์นี้ เมื่อทำปฏิกิริยากับอะมีน ' +
      'จากโปรตีนในอาหาร (โดยเฉพาะเมื่อย่าง/ทอดที่อุณหภูมิสูง) จะเกิด N-nitrosamines ' +
      'ซึ่ง IARC จัดเป็น probable carcinogen (Group 2A) และ WHO แนะนำให้จำกัดการบริโภค',
    icon:      'dangerous',
    reference: 'IARC Monograph 94, WHO/IARC 2015 Red Meat & Processed Meat Report',
    detect(codes) {
      const present = [...NITRITES, ...NITRATES].filter(c => codes.has(c));
      return present.length > 0 ? present : null;
    },
  },

  // ── HIGH: Southampton 6 — multiple azo dyes ───────────────────────────────
  {
    id:       'southampton6',
    severity: 'high',
    title:    '"Southampton 6" สีย้อมอะโซหลายชนิด — สมาธิสั้นในเด็ก',
    description: 'พบสีย้อมจากกลุ่ม "Southampton 6" หลายรายการ (E102, E104, E110, E122, E124, E129) ' +
      'การศึกษา McCann et al. (2007, Lancet) พบว่าการรับประทานสีย้อมกลุ่มนี้รวมกับ sodium benzoate ' +
      'เพิ่มอาการสมาธิสั้น (ADHD) ในเด็กอย่างมีนัยสำคัญ EU กำหนดให้ต้องมีคำเตือน "may have an adverse effect on activity and attention in children"',
    icon:      'child_care',
    reference: 'McCann et al. Lancet 2007;370:1560–1567, EFSA Opinion 2008',
    detect(codes) {
      const present = SOUTHAMPTON_6.filter(c => codes.has(c));
      return present.length >= 2 ? present : null;
    },
  },

  // ── HIGH: BHA + BHT synergistic effect ────────────────────────────────────
  {
    id:       'bha_bht',
    severity: 'high',
    title:    'BHA + BHT — ผลสะสมต่อมะเร็ง',
    description: 'พบทั้ง BHA (E320, IARC Group 2B) และ BHT (E321) ในผลิตภัณฑ์เดียวกัน ' +
      'การศึกษาในสัตว์ทดลองพบว่าการใช้ร่วมกันอาจมีผลเสริม (synergistic) ต่อเนื้องอกในกระเพาะอาหาร ' +
      'BHA ยังถูกจัด California Prop 65 carcinogen list และถูกห้ามใช้ในญี่ปุ่น',
    icon:      'biotech',
    reference: 'Ito et al. (1983) Gann, California OEHHA Prop 65 List',
    detect(codes) {
      if (codes.has('E320') && codes.has('E321')) return ['E320', 'E321'];
      return null;
    },
  },

  // ── HIGH: Multiple sulphites — cumulative SO₂ exposure ───────────────────
  {
    id:       'sulphite_overload',
    severity: 'high',
    title:    'ซัลไฟต์หลายชนิด — SO₂ สะสมเกิน ADI',
    description: 'พบซัลไฟต์หลายรายการ (E220–E228) ในผลิตภัณฑ์นี้ ' +
      'ปริมาณ SO₂ รวมอาจเกิน ADI ที่ EFSA กำหนดไว้ที่ 0.7 mg/kg น้ำหนักตัว/วัน ' +
      'เพิ่มความเสี่ยงต่ออาการหอบหืด ปวดหัว และปฏิกิริยาการแพ้อย่างรุนแรง (anaphylaxis) ' +
      'ในผู้ที่มีความไวต่อซัลไฟต์ ผู้เป็นหอบหืด 5–10% แพ้ซัลไฟต์',
    icon:      'air',
    reference: 'EFSA ANS Panel Opinion 2016, FDA CFR 21 §101.100',
    detect(codes) {
      const present = SULPHITES.filter(c => codes.has(c));
      return present.length >= 3 ? present : null;
    },
  },

  // ── MEDIUM: Phosphate overload ────────────────────────────────────────────
  {
    id:       'phosphate_load',
    severity: 'medium',
    title:    'ฟอสเฟตสูง — เสี่ยงต่อไตและกระดูก',
    description: 'พบสารฟอสเฟต (E338–E343) หลายรายการ การรับประทานฟอสเฟตสูงเกิน ' +
      'เชื่อมโยงกับการลดลงของ GFR (kidney function) ในผู้ป่วยโรคไต ' +
      'และลดการดูดซึมแคลเซียม ส่งผลต่อความหนาแน่นของกระดูกในระยะยาว ' +
      'EFSA แนะนำ TDI ที่ 70 mg/kg บน/วัน (ในรูปฟอสฟอรัส)',
    icon:      'medication',
    reference: 'EFSA NDA Panel (2015) Scientific Opinion on Phosphorus, Ritz et al. Clin J Am Soc Nephrol 2012',
    detect(codes) {
      const present = PHOSPHATES.filter(c => codes.has(c));
      return present.length >= 2 ? present : null;
    },
  },

  // ── MEDIUM: Multiple synthetic antioxidants ───────────────────────────────
  {
    id:       'synthetic_antioxidants',
    severity: 'medium',
    title:    'สารต้านออกซิเดชันสังเคราะห์หลายชนิด',
    description: 'พบสารต้านออกซิเดชันสังเคราะห์ (E310–E321) หลายรายการ ' +
      'รวมถึง propyl gallate, TBHQ, BHA, และ BHT ซึ่งต่างมีข้อกังวลด้านความปลอดภัยในตัวเอง ' +
      'การใช้ร่วมกันสูงกว่ากรณีใช้ตัวเดียวและอาจเกิน ADI สะสมได้',
    icon:      'labs',
    reference: 'EFSA ANS Panel Opinions on Gallates (2014), TBHQ (2004), BHA & BHT (2011)',
    detect(codes) {
      const present = SYNTHETIC_ANTIOXIDANTS.filter(c => codes.has(c));
      return present.length >= 3 ? present : null;
    },
  },

  // ── MEDIUM: Caramel IV + Sulphite ─────────────────────────────────────────
  {
    id:       'caramel_sulphite',
    severity: 'medium',
    title:    'Caramel Color IV + ซัลไฟต์ — 4-MEI & SO₂',
    description: 'พบ Caramel Color IV (E150d) ร่วมกับซัลไฟต์ ' +
      'E150d ผลิตด้วยกระบวนการที่ใช้แอมโมเนียมซัลไฟต์ ทำให้มีสาร 4-methylimidazole (4-MEI) ' +
      'ซึ่ง California Prop 65 จัดเป็นสารก่อมะเร็ง ร่วมกับ SO₂ จากซัลไฟต์ยิ่งเพิ่มภาระสารพิษต่อร่างกาย',
    icon:      'warning',
    reference: 'California OEHHA Prop 65, IARC Monograph (4-MEI), EFSA re-evaluation E150d 2011',
    detect(codes) {
      if (codes.has('E150d') && SULPHITES.some(c => codes.has(c))) {
        return ['E150d', ...SULPHITES.filter(c => codes.has(c))];
      }
      return null;
    },
  },

  // ── MEDIUM: Multiple coloring agents ─────────────────────────────────────
  {
    id:       'color_overload',
    severity: 'medium',
    title:    'สีผสมอาหารสังเคราะห์หลายชนิด — ปริมาณสะสม',
    description: 'พบสีผสมอาหารสังเคราะห์หลายรายการ ปริมาณรวมอาจเกิน ADI ของแต่ละสาร ' +
      'โดยเฉพาะสำหรับเด็กที่น้ำหนักตัวน้อยกว่าผู้ใหญ่ ' +
      'แนะนำให้หลีกเลี่ยงผลิตภัณฑ์ที่มีสีสังเคราะห์มากกว่า 3 ชนิด โดยเฉพาะในเด็ก',
    icon:      'palette',
    reference: 'EFSA collective assessment of food colour ADIs',
    detect(codes) {
      const syntheticColors = ['E102','E104','E110','E120','E122','E123','E124','E127','E129','E131','E132','E133','E151','E155'];
      const present = syntheticColors.filter(c => codes.has(c));
      return present.length >= 3 ? present : null;
    },
  },
];

// ── Main function ─────────────────────────────────────────────────────────────

/** Detect all dangerous interactions from a product's additive list */
export function detectInteractions(additives: Additive[]): AdditiveInteraction[] {
  if (!additives || additives.length === 0) return [];

  const presentCodes = new Set(additives.map(a => a.code.toUpperCase()));
  const results: AdditiveInteraction[] = [];

  for (const rule of RULES) {
    const triggerCodes = rule.detect(presentCodes);
    if (triggerCodes) {
      results.push({
        id:          rule.id,
        severity:    rule.severity,
        title:       rule.title,
        description: rule.description,
        icon:        rule.icon,
        codes:       triggerCodes,
        reference:   rule.reference,
      });
    }
  }

  // Sort: critical first, then high, then medium
  const ORDER = { critical: 0, high: 1, medium: 2 };
  return results.sort((a, b) => ORDER[a.severity] - ORDER[b.severity]);
}

/** Quick check — does this product have any interactions? */
export function hasInteractions(additives: Additive[]): boolean {
  return detectInteractions(additives).length > 0;
}
