/**
 * Shared Utilities — Extracted duplicated functions
 *
 * Canonical implementations of:
 * - gradeColorClasses() — Tailwind badge classes by safety grade (A-E)
 * - gradeTextColor()    — Text color class by numeric safety score
 * - timeAgo()          — Thai-language relative time formatter
 * - getAllergenIcon()  — Icon lookup for allergen names
 */

/**
 * Grade config object with all styling properties
 */
interface GradeConfig {
  bg: string;
  text: string;
  bar: string;
  label: string;
  badgeBg: string;
  border: string;
}

const GRADE_CONFIGS: Record<string, GradeConfig> = {
  A: { bg: 'bg-green-50',  text: 'text-green-700',  bar: 'bg-green-500',  label: 'ยอดเยี่ยม', badgeBg: 'bg-green-100',  border: 'border-green-200'  },
  B: { bg: 'bg-lime-50',   text: 'text-lime-700',   bar: 'bg-lime-500',   label: 'ดี',        badgeBg: 'bg-lime-100',   border: 'border-lime-200'   },
  C: { bg: 'bg-yellow-50', text: 'text-yellow-700', bar: 'bg-yellow-400', label: 'ปานกลาง',   badgeBg: 'bg-yellow-100', border: 'border-yellow-200' },
  D: { bg: 'bg-orange-50', text: 'text-orange-700', bar: 'bg-orange-400', label: 'ควรระวัง',  badgeBg: 'bg-orange-100', border: 'border-orange-200' },
  E: { bg: 'bg-red-50',    text: 'text-red-700',    bar: 'bg-red-500',    label: 'เสี่ยง',    badgeBg: 'bg-red-100',    border: 'border-red-200'    },
};

/**
 * Returns Tailwind class string for grade badge styling (border + text + bg).
 * Canonical grades: A=green, B=lime, C=yellow, D=orange, E=red
 */
export function gradeColorClasses(grade: string | null): string {
  switch (grade) {
    case 'A':
      return 'border-green-400 text-green-600 bg-green-50';
    case 'B':
      return 'border-lime-400 text-lime-600 bg-lime-50';
    case 'C':
      return 'border-yellow-400 text-yellow-600 bg-yellow-50';
    case 'D':
      return 'border-orange-400 text-orange-600 bg-orange-50';
    case 'E':
      return 'border-red-400 text-red-600 bg-red-50';
    default:
      return 'border-gray-300 text-gray-500 bg-gray-50';
  }
}

/**
 * Returns full grade config object with bg, text, bar, label
 */
export function getGradeConfig(grade: string | null): GradeConfig {
  if (!grade || !(grade in GRADE_CONFIGS)) {
    return { bg: 'bg-gray-50', text: 'text-gray-500', bar: 'bg-gray-300', label: '-', badgeBg: 'bg-gray-100', border: 'border-gray-200' };
  }
  return GRADE_CONFIGS[grade];
}

/**
 * Returns text color class based on numeric safety score.
 * Score thresholds: A≥85, B≥70, C≥55, D≥40, E<40
 */
export function gradeTextColor(score: number): string {
  if (score >= 85) return 'text-green-700';
  if (score >= 70) return 'text-lime-700';
  if (score >= 55) return 'text-yellow-700';
  if (score >= 40) return 'text-orange-700';
  return 'text-red-700';
}

/**
 * Returns Thai-language relative time string from ISO timestamp.
 * Examples: "เมื่อกี้", "5 นาทีที่แล้ว", "2 ชั่วโมงที่แล้ว", "3 วันที่แล้ว"
 */
export function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);

  if (m < 1) return 'เมื่อกี้';
  if (m < 60) return `${m} นาทีที่แล้ว`;

  const h = Math.floor(m / 60);
  if (h < 24) return `${h} ชั่วโมงที่แล้ว`;

  const d = Math.floor(h / 24);
  if (d < 7) return `${d} วันที่แล้ว`;

  return new Date(iso).toLocaleDateString('th-TH', {
    day: 'numeric',
    month: 'short'
  });
}

/**
 * Returns material symbol icon name for allergen.
 * Merged from both AllergenAlert and ProductLabels implementations.
 */
export function getAllergenIcon(allergen: string): string {
  const ALLERGEN_ICONS: Record<string, string> = {
    // From AllergenAlert
    gluten:      'grain',
    milk:        'water_drop',
    eggs:        'egg',
    nuts:        'forest',
    peanuts:     'park',
    soybeans:    'eco',
    fish:        'set_meal',
    crustaceans: 'cruelty_free',
    molluscs:    'cruelty_free',
    sesame:      'spa',
    sulphites:   'science',
    celery:      'eco',
    mustard:     'eco',
    lupin:       'eco',

    // From ProductLabels (alternative spellings)
    peanut:      'park',
    soy:         'eco',
    crustacean:  'cruelty_free',
    sulphite:    'science',
  };

  const lc = allergen.toLowerCase();
  for (const [key, icon] of Object.entries(ALLERGEN_ICONS)) {
    if (lc.includes(key)) return icon;
  }
  return 'warning';
}
