import type { Product } from '../types';

export const HEALTH_GOALS = [
  { id: 'keto', name: 'คีโต (Keto)', description: 'ทานคาร์โบไฮเดรตและน้ำตาลต่ำมาก' },
  { id: 'vegan', name: 'วีแกน (Vegan)', description: 'ไม่ทานผลิตภัณฑ์จากสัตว์' },
  { id: 'halal', name: 'ฮาลาล (Halal)', description: 'ทานอาหารฮาลาล' },
  { id: 'low-sugar', name: 'ลดน้ำตาล', description: 'เลี่ยงการบริโภคน้ำตาล' },
  { id: 'low-sodium', name: 'ลดโซเดียม', description: 'ลดปริมาณเกลือและโซเดียม' },
  { id: 'diabetic', name: 'เบาหวาน', description: 'ควบคุมน้ำตาลอย่างเข้มงวด' },
];

export function applyHealthGoals(product: Product, goals: string[]): Product {
  if (!goals || goals.length === 0) return product;

  let scoreModifiers = 0;
  const warnings: string[] = [];

  const n = product.nutrition;

  // Keto
  if (goals.includes('keto')) {
    if (n.carbs > 10 || n.sugar > 5) {
      scoreModifiers -= 20;
      warnings.push('มีคาร์โบไฮเดรตหรือน้ำตาลสูง ไม่เหมาะกับคีโต');
    }
  }

  // Vegan
  if (goals.includes('vegan')) {
    if (product.isVegan === false || product.ingredients.some(i => i.name.toLowerCase().includes('milk') || i.name.toLowerCase().includes('meat') || i.name.toLowerCase().includes('egg') || i.name.toLowerCase().includes('fish') || i.name.toLowerCase().includes('honey') || i.name.toLowerCase().includes('cheese'))) {
      scoreModifiers -= 50;
      warnings.push('มีส่วนผสมจากสัตว์ ไม่ใช่วีแกน');
    } else if (product.isVegan) {
      scoreModifiers += 5;
    }
  }

  // Halal
  if (goals.includes('halal')) {
    if (product.isHalal === false || product.ingredients.some(i => i.name.toLowerCase().includes('pork') || i.name.toLowerCase().includes('alcohol') || i.name.toLowerCase().includes('wine') || i.name.toLowerCase().includes('beer'))) {
      scoreModifiers -= 50;
      warnings.push('อาจมีส่วนผสมที่ไม่ฮาลาล');
    } else if (product.isHalal) {
      scoreModifiers += 5;
    }
  }

  // Low Sugar
  if (goals.includes('low-sugar') || goals.includes('diabetic')) {
    if (n.sugar > 10) {
      scoreModifiers -= 20;
      warnings.push('น้ำตาลสูงเกินเป้าหมายของคุณ');
    } else if (n.sugar <= 5) {
      scoreModifiers += 5;
    }
  }

  // Low Sodium
  if (goals.includes('low-sodium')) {
    if (n.sodium > 0.4) {
      scoreModifiers -= 20;
      warnings.push('โซเดียมสูงเกินเป้าหมายของคุณ');
    }
  }
  
  const originalScore = product.safetyScore;
  const newScore = Math.max(10, Math.min(100, originalScore + scoreModifiers));

  const newProduct: Product = {
    ...product,
    safetyScore: newScore,
    grade: gradeFromScore(newScore),
  };

  // Attach healthWarnings if there are any
  if (warnings.length > 0) {
    newProduct.healthWarnings = warnings;
  }

  return newProduct;
}

function gradeFromScore(score: number): any {
  if (score >= 85) return 'A';
  if (score >= 70) return 'B';
  if (score >= 55) return 'C';
  if (score >= 40) return 'D';
  return 'E';
}
