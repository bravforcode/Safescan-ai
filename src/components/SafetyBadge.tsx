import { useEffect, useRef, useState } from 'react';
import type { SafetyGrade } from '../types';

const GRADE_CONFIG: Record<SafetyGrade, { ringColor: string; textColor: string; bg: string; border: string; label: string; desc: string }> = {
  A: { ringColor: '#00C853', textColor: '#00A846', bg: 'bg-green-50', border: 'border-green-300', label: 'ยอดเยี่ยม', desc: 'ปลอดภัยสูง' },
  B: { ringColor: '#1E88E5', textColor: '#1565C0', bg: 'bg-blue-50', border: 'border-blue-300', label: 'ดี', desc: 'ปลอดภัย' },
  C: { ringColor: '#FFB300', textColor: '#F57F17', bg: 'bg-yellow-50', border: 'border-yellow-300', label: 'พอใช้', desc: 'ระวังบางส่วน' },
  D: { ringColor: '#FF7043', textColor: '#BF360C', bg: 'bg-orange-50', border: 'border-orange-300', label: 'ควรระวัง', desc: 'ส่วนผสมเสี่ยง' },
  E: { ringColor: '#F44336', textColor: '#B71C1C', bg: 'bg-red-50', border: 'border-red-300', label: 'ไม่แนะนำ', desc: 'ไม่ปลอดภัย' },
};

interface SafetyBadgeProps {
  grade: SafetyGrade;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  animate?: boolean;
}

export function SafetyBadge({ grade, size = 'md', showLabel = false, animate = false }: SafetyBadgeProps) {
  const cfg = GRADE_CONFIG[grade];
  const [visible, setVisible] = useState(!animate);

  useEffect(() => {
    if (animate) {
      const t = setTimeout(() => setVisible(true), 80);
      return () => clearTimeout(t);
    }
  }, [animate]);

  const sizeClass = size === 'sm'
    ? 'w-7 h-7 text-xs'
    : size === 'lg'
    ? 'w-14 h-14 text-2xl'
    : 'w-9 h-9 text-sm';

  return (
    <div className={`flex items-center gap-2 ${visible ? 'animate-scaleIn' : 'opacity-0'}`}>
      <div
        className={`${sizeClass} ${cfg.bg} border-2 ${cfg.border} rounded-full flex items-center justify-center font-black transition-all duration-300 hover:scale-110 hover:shadow-lg cursor-default`}
        style={{ color: cfg.textColor }}
        aria-label={`เกรดความปลอดภัย ${grade} — ${cfg.label}`}
      >
        {grade}
      </div>
      {showLabel && (
        <div className="animate-fadeIn delay-100">
          <span className="text-sm font-bold transition-colors duration-200" style={{ color: cfg.textColor }}>{cfg.label}</span>
          <p className="text-xs text-gray-400 transition-colors duration-200">{cfg.desc}</p>
        </div>
      )}
    </div>
  );
}

/* ──────────────────────────────────────────
   Animated SVG Gauge
────────────────────────────────────────── */
interface SafetyScoreGaugeProps {
  score: number;
  grade: SafetyGrade;
}

export function SafetyScoreGauge({ score, grade }: SafetyScoreGaugeProps) {
  const R = 44;
  const circumference = 2 * Math.PI * R; // ≈ 276.46
  const targetOffset = circumference - (score / 100) * circumference;
  const cfg = GRADE_CONFIG[grade];

  const circleRef = useRef<SVGCircleElement>(null);
  const [animated, setAnimated] = useState(false);

  useEffect(() => {
    // Start from full (empty) then animate to target
    if (circleRef.current) {
      circleRef.current.style.strokeDashoffset = String(circumference);
    }
    const t = setTimeout(() => setAnimated(true), 150);
    return () => clearTimeout(t);
  }, [circumference]);

  return (
    <div className="flex flex-col items-center gap-4 animate-fadeUp">
      {/* Score Ring */}
      <div className="relative w-44 h-44 flex items-center justify-center">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
          {/* Background track */}
          <circle cx="50" cy="50" r={R} fill="none" stroke="#EFF6FF" strokeWidth="9" />
          {/* Animated fill */}
          <circle
            ref={circleRef}
            cx="50" cy="50" r={R}
            fill="none"
            stroke={cfg.ringColor}
            strokeWidth="9"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={animated ? targetOffset : circumference}
            style={{
              transition: 'stroke-dashoffset 1.3s cubic-bezier(0.22, 1, 0.36, 1)',
              filter: `drop-shadow(0 0 8px ${cfg.ringColor}55)`,
            }}
          />
        </svg>
        {/* Score number */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span
            className="text-5xl font-black leading-none tabular-nums"
            style={{ color: cfg.ringColor }}
          >
            {score}
          </span>
          <span className="text-xs text-gray-400 font-semibold mt-1">/ 100</span>
        </div>
      </div>

      {/* Grade + Label */}
      <div className={`flex items-center gap-3 px-5 py-2.5 rounded-2xl border-2 ${cfg.bg} ${cfg.border} animate-fadeUp delay-300`}>
        <span className="text-2xl font-black" style={{ color: cfg.textColor }}>{grade}</span>
        <div>
          <p className="font-bold text-sm" style={{ color: cfg.textColor }}>{cfg.label}</p>
          <p className="text-xs text-gray-500">{cfg.desc}</p>
        </div>
      </div>
    </div>
  );
}
