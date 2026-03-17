export const LEVEL_THRESHOLDS = [
  0, 50, 150, 300, 500, 800, 1200, 1700, 2500, 3500 // Levels 1-10
];

export function calculateLevel(points: number): number {
  if (!points || points < 0) return 1;
  for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
    if (points >= LEVEL_THRESHOLDS[i]) return i + 1;
  }
  return 1;
}

export function getProgressToNextLevel(points: number = 0): { current: number, next: number, percent: number, level: number } {
  const level = calculateLevel(points);
  const currentLevelThreshold = LEVEL_THRESHOLDS[level - 1] ?? 0;
  const nextLevelThreshold = LEVEL_THRESHOLDS[level] || currentLevelThreshold + 1500;
  
  const pointsInLevel = points - currentLevelThreshold;
  const pointsNeeded = nextLevelThreshold - currentLevelThreshold;
  const percent = Math.min(100, Math.max(0, (pointsInLevel / pointsNeeded) * 100));
  
  return { current: points, next: nextLevelThreshold, percent, level };
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  condition: (profile: any) => boolean;
}

export const BADGES: Badge[] = [
  {
    id: 'first_scan',
    name: 'นักสำรวจมือใหม่',
    description: 'สแกนสินค้าชิ้นแรกของคุณ',
    icon: 'qr_code_scanner',
    color: 'bg-blue-100 text-blue-600',
    condition: (p) => (p?.scan_count || 0) >= 1
  },
  {
    id: 'health_conscious',
    name: 'ใส่ใจสุขภาพ',
    description: 'บันทึกเป้าหมายสุขภาพ (Health Goals)',
    icon: 'health_and_safety',
    color: 'bg-green-100 text-green-600',
    condition: (p) => (p?.health_goals || []).length > 0
  },
  {
    id: 'veteran_scanner',
    name: 'กูรูนักสแกน',
    description: 'สแกนสินค้ามากกว่า 50 ชิ้น',
    icon: 'verified',
    color: 'bg-yellow-100 text-yellow-600',
    condition: (p) => (p?.scan_count || 0) >= 50
  },
  {
    id: 'level_5',
    name: 'นักโภชนาการฝึกหัด',
    description: 'บรรลุเลเวล 5',
    icon: 'military_tech',
    color: 'bg-purple-100 text-purple-600',
    condition: (p) => calculateLevel(p?.points || 0) >= 5
  }
];

export function getEarnedBadges(profile: any): Badge[] {
  if (!profile) return [];
  return BADGES.filter(b => b.condition(profile));
}
