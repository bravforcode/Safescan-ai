import { ReactNode } from 'react';

interface AchievementBadgeCardProps {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  unlocked: boolean;
  index: number;
}

// Color utility - extract from Tailwind class string
function extractColorClasses(colorString: string) {
  // Expected format: "bg-blue-100 text-blue-600"
  const [bgClass, textClass] = colorString.split(' ');
  return { bgClass, textClass };
}

export function AchievementBadgeCard({
  id,
  name,
  description,
  icon,
  color,
  unlocked,
  index
}: AchievementBadgeCardProps) {
  const { bgClass, textClass } = extractColorClasses(color);

  return (
    <div
      className={`group relative transform transition-all duration-500 ease-out ${
        unlocked
          ? `animate-fadeUp hover:scale-110 hover:-translate-y-2`
          : 'opacity-50'
      }`}
      style={unlocked ? { animationDelay: `${index * 100}ms` } : undefined}
    >
      {/* Glow effect on unlock */}
      {unlocked && (
        <div className={`absolute inset-0 ${bgClass} rounded-2xl blur-lg opacity-0 group-hover:opacity-60 transition-opacity duration-300`} />
      )}

      {/* Card */}
      <div
        className={`relative rounded-2xl p-4 md:p-5 border-2 transition-all duration-300 backdrop-blur-sm
          ${
            unlocked
              ? `${bgClass} ${textClass} border-current/20 shadow-lg group-hover:shadow-2xl group-hover:border-current/50`
              : 'bg-gray-50 text-gray-400 border-gray-200 shadow-sm'
          }
        `}
      >
        {/* Locked overlay */}
        {!unlocked && (
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-black/5 to-black/10 flex items-center justify-center">
            <span className="material-symbols-outlined text-gray-300 text-2xl">lock</span>
          </div>
        )}

        {/* Badge icon */}
        <div className={`flex justify-center mb-3 transition-transform duration-300 ${unlocked ? 'group-hover:scale-125 group-hover:-rotate-12' : ''}`}>
          <span className={`material-symbols-outlined text-4xl font-bold ${unlocked ? 'animate-pulse' : ''}`}>
            {icon}
          </span>
        </div>

        {/* Text content */}
        <div className="text-center">
          <h3 className="font-bold text-sm md:text-base mb-1 line-clamp-2">{name}</h3>
          <p className={`text-[11px] md:text-xs leading-snug opacity-75 line-clamp-2`}>
            {description}
          </p>
        </div>

        {/* Achievement indicator */}
        {unlocked && (
          <div className="absolute -top-2 -right-2 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center shadow-lg transform group-hover:scale-125 transition-transform duration-300">
            <span className="material-symbols-outlined text-white text-base">check</span>
          </div>
        )}
      </div>
    </div>
  );
}
