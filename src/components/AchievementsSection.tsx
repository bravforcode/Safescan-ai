import { AchievementMedalCard } from './AchievementMedalCard';
import { AchievementBadgeCard } from './AchievementBadgeCard';
import { BADGES, getEarnedBadges, type Badge } from '../lib/gamification';

interface AchievementsSectionProps {
  points: number;
  scanCount: number;
  profile: any;
}

export function AchievementsSection({ points, scanCount, profile }: AchievementsSectionProps) {
  const earnedBadges = profile ? getEarnedBadges(profile) : [];
  const earnedIds = new Set(earnedBadges.map(b => b.id));

  return (
    <div className="space-y-6">
      {/* Medal Card */}
      <AchievementMedalCard points={points} scanCount={scanCount} />

      {/* Badges Title */}
      <div className="px-1">
        <h3 className="font-bold text-gray-800 text-lg mb-1 flex items-center gap-2">
          <span className="material-symbols-outlined text-primary-500">military_tech</span>
          เหรียญและรางวัล
        </h3>
        <p className="text-sm text-gray-400">
          {earnedBadges.length} / {BADGES.length} ได้รับมา
        </p>
      </div>

      {/* Badges Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        {BADGES.map((badge, index) => (
          <AchievementBadgeCard
            key={badge.id}
            {...badge}
            unlocked={earnedIds.has(badge.id)}
            index={index}
          />
        ))}
      </div>

      {/* Unlocked info box */}
      {earnedBadges.length > 0 && (
        <div className="card p-4 bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 info-slide-in">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0 mt-0.5 hover-lift">
              <span className="material-symbols-outlined text-white text-base">check</span>
            </div>
            <div>
              <h4 className="font-bold text-green-900 mb-1">ยินดีด้วย!</h4>
              <p className="text-sm text-green-700">
                คุณได้ปลดล็อก {earnedBadges.length} เหรียญแล้ว ติดตามสแกนสินค้าต่อไปเพื่อปลดล็อกเหรียญอื่นๆ
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Locked badges hint */}
      {earnedBadges.length < BADGES.length && (
        <div className="card p-4 bg-gradient-to-br from-blue-50 to-cyan-50 border border-blue-200 info-slide-in">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0 mt-0.5 hover-lift">
              <span className="material-symbols-outlined text-white text-base">info</span>
            </div>
            <div>
              <h4 className="font-bold text-blue-900 mb-1">เหรียญที่รอสัญญา</h4>
              <p className="text-sm text-blue-700">
                สแกนสินค้าและตั้งเป้าหมายสุขภาพเพื่อปลดล็อกเหรียญใหม่และบรรลุเลเวลสูงสุด
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
