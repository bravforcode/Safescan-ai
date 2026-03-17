import { useMemo } from 'react';
import { calculateLevel, getProgressToNextLevel } from '../lib/gamification';
import { LEVEL_THRESHOLDS } from '../lib/gamification';

interface AchievementMedalCardProps {
  points: number;
  scanCount: number;
}

export function AchievementMedalCard({ points, scanCount }: AchievementMedalCardProps) {
  const currentLevel = calculateLevel(points);
  const progress = getProgressToNextLevel(points);

  // Medal tier based on level
  const medalTier = useMemo(() => {
    if (currentLevel >= 10) return { icon: 'trophy', color: 'from-yellow-400 to-yellow-600', label: 'Legendary' };
    if (currentLevel >= 8) return { icon: 'military_tech', color: 'from-purple-400 to-purple-600', label: 'Platinum' };
    if (currentLevel >= 5) return { icon: 'medal', color: 'from-amber-400 to-amber-600', label: 'Gold' };
    return { icon: 'grade', color: 'from-slate-400 to-slate-600', label: 'Silver' };
  }, [currentLevel]);

  const nextLevelThreshold = LEVEL_THRESHOLDS[currentLevel] || (LEVEL_THRESHOLDS[currentLevel - 1] || 0) + 1500;

  return (
    <div className="relative card p-0 overflow-hidden animate-fadeUp">
      {/* Background gradient overlay */}
      <div className={`absolute inset-0 bg-gradient-to-br ${medalTier.color} opacity-5`} />

      <div className="relative p-6 md:p-8 flex flex-col md:flex-row items-center gap-6 md:gap-8">
        {/* Medal Icon Container */}
        <div className="relative flex-shrink-0">
          <div className="absolute inset-0 bg-gradient-to-br from-primary-400 to-primary-600 rounded-full blur-2xl opacity-30 medal-glow" />
          <div className={`medal-float relative w-32 h-32 md:w-40 md:h-40 rounded-full bg-gradient-to-br ${medalTier.color} flex items-center justify-center shadow-2xl hover:shadow-none transition-all duration-300`}>
            <span className="material-symbols-outlined text-white text-6xl md:text-7xl font-bold">{medalTier.icon}</span>
          </div>

          {/* Level Badge */}
          <div className="absolute -bottom-2 -right-2 w-14 h-14 md:w-16 md:h-16 rounded-full bg-white shadow-lg flex items-center justify-center border-4 border-primary-50 hover-lift level-badge-pulse">
            <div className="text-center">
              <div className="text-2xl md:text-3xl font-black text-primary-600">{currentLevel}</div>
              <p className="text-[8px] md:text-[9px] text-gray-400 font-bold leading-none">LEVEL</p>
            </div>
          </div>
        </div>

        {/* Info Section */}
        <div className="flex-1 text-center md:text-left">
          <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-1 text-fade-in">เหรียญรางวัลเหริยมรับยศ</h3>
          <h2 className="text-3xl md:text-4xl font-black text-gray-900 mb-2 text-fade-in">
            {medalTier.label} <span className="text-primary-600">Tier</span>
          </h2>

          {/* Stats Row */}
          <div className="flex flex-wrap gap-3 md:gap-4 mb-5 justify-center md:justify-start text-sm">
            <div className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-primary-500 text-xl">trending_up</span>
              <div>
                <p className="text-[10px] text-gray-400">คะแนนสะสม</p>
                <p className="font-bold text-gray-900">{points.toLocaleString()} pts</p>
              </div>
            </div>
            <div className="h-10 w-px bg-gray-200" />
            <div className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-green-500 text-xl">check_circle</span>
              <div>
                <p className="text-[10px] text-gray-400">สแกนแล้ว</p>
                <p className="font-bold text-gray-900">{scanCount} สินค้า</p>
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-bold text-gray-600">ความคืบหน้าไปยังเลเวล {currentLevel + 1}</span>
              <span className="text-xs font-bold text-primary-600">{Math.round(progress.percent)}%</span>
            </div>
            <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden backdrop-blur-sm">
              <div
                className="h-full bg-gradient-to-r from-primary-400 to-primary-600 rounded-full shadow-md progress-fill"
                style={{
                  width: `${progress.percent}%`,
                  animationDuration: `${Math.max(1, progress.percent / 100)}s`
                }}
              />
            </div>
            <p className="text-[10px] text-gray-400">
              {nextLevelThreshold - points > 0
                ? `${nextLevelThreshold - points} แต้มไปยังเลเวลถัดไป`
                : 'ระดับสูงสุด!'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
