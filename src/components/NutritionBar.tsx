import { useEffect, useState } from 'react';

interface NutritionBarProps {
  label: string;
  value: number;
  unit: string;
  max: number;
  color?: string;
  icon?: string;
  delay?: number;
}

const LEVEL_CONFIG = (pct: number) => {
  if (pct < 30) return { text: 'ต่ำ', color: 'text-green-600', bg: 'bg-green-50' };
  if (pct < 60) return { text: 'ปกติ', color: 'text-blue-600', bg: 'bg-blue-50' };
  if (pct < 80) return { text: 'สูง', color: 'text-yellow-600', bg: 'bg-yellow-50' };
  return { text: 'สูงมาก', color: 'text-red-600', bg: 'bg-red-50' };
};

export function NutritionBar({ label, value, unit, max, color = 'bg-primary-500', icon, delay = 0 }: NutritionBarProps) {
  const pct = Math.min((value / max) * 100, 100);
  const { text: levelText, color: levelColor, bg: levelBg } = LEVEL_CONFIG(pct);

  // Animate from 0 → pct on mount
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setWidth(pct), 120 + delay);
    return () => clearTimeout(t);
  }, [pct, delay]);

  return (
    <div className="space-y-1.5 animate-fadeUp" style={{ animationDelay: `${delay}ms` }}>
      <div className="flex justify-between items-center text-sm">
        <span className="font-semibold text-gray-800 flex items-center gap-1.5">
          {icon && (
            <span className="material-symbols-outlined text-gray-400" style={{ fontSize: '16px' }}>
              {icon}
            </span>
          )}
          {label}
        </span>
        <div className="flex items-center gap-1.5">
          <span className="font-bold text-gray-900 tabular-nums">{value.toFixed(1)}<span className="text-gray-400 font-normal ml-0.5">{unit}</span></span>
          <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${levelBg} ${levelColor}`}>{levelText}</span>
        </div>
      </div>
      <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
        <div
          className={`h-full rounded-full ${color}`}
          style={{
            width: `${width}%`,
            transition: `width 0.9s cubic-bezier(0.22, 1, 0.36, 1) ${delay}ms`,
          }}
        />
      </div>
    </div>
  );
}
