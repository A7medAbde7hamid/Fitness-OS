import React, { useMemo } from 'react';
import { Flame, Sparkles, Target, Zap } from 'lucide-react';
import { useI18n } from '../../context/I18nContext';
import { formatCalories, formatGrams, formatNumber } from '../../i18n/formatters';
import { GlassCard } from '../ui/GlassCard';
import { Badge } from '../ui/Badge';

export interface CircularProgressProps {
  caloriesConsumed: number;
  caloriesTarget: number;
  proteinConsumedGrams: number;
  proteinTargetGrams: number;
  carbsConsumedGrams?: number;
  carbsTargetGrams?: number;
  fatConsumedGrams?: number;
  fatTargetGrams?: number;
  activeCaloriesBurned?: number;
  className?: string;
  size?: number; // Size in pixels, default 240
}

/**
 * Concentric Dual-Ring Circular Progress Component
 * Visualizes daily calorie and protein consumption against targets with high-craft glassmorphism styling
 */
export const CircularProgress: React.FC<CircularProgressProps> = ({
  caloriesConsumed,
  caloriesTarget,
  proteinConsumedGrams,
  proteinTargetGrams,
  carbsConsumedGrams = 0,
  carbsTargetGrams = 200,
  fatConsumedGrams = 0,
  fatTargetGrams = 65,
  activeCaloriesBurned = 0,
  className = '',
  size = 230,
}) => {
  const { t, language, formatNumber } = useI18n();

  const calTarget = Math.max(1, caloriesTarget || 2000);
  const protTarget = Math.max(1, proteinTargetGrams || 150);

  const calPercentage = Math.min(100, Math.round((caloriesConsumed / calTarget) * 100));
  const protPercentage = Math.min(100, Math.round((proteinConsumedGrams / protTarget) * 100));

  const caloriesRemaining = Math.max(0, calTarget - caloriesConsumed);
  const isOverCalorieTarget = caloriesConsumed > calTarget;

  // Geometry calculations
  const center = size / 2;
  const strokeWidth = 12;

  // Outer Ring (Calories)
  const outerRadius = (size - strokeWidth * 2) / 2 - 4;
  const outerCircumference = 2 * Math.PI * outerRadius;
  const outerOffset = outerCircumference - (Math.min(100, (caloriesConsumed / calTarget) * 100) / 100) * outerCircumference;

  // Inner Ring (Protein)
  const innerRadius = outerRadius - strokeWidth - 6;
  const innerCircumference = 2 * Math.PI * innerRadius;
  const innerOffset = innerCircumference - (Math.min(100, (proteinConsumedGrams / protTarget) * 100) / 100) * innerCircumference;

  const statusBadge = useMemo(() => {
    if (isOverCalorieTarget) {
      return {
        label: t('dashboard.statusOverBudget') || 'Over Budget',
        variant: 'rose' as const,
      };
    }
    if (calPercentage >= 90) {
      return {
        label: t('dashboard.statusOptimal') || 'Target Reached',
        variant: 'emerald' as const,
      };
    }
    return {
      label: t('dashboard.statusOnTrack') || 'On Track',
      variant: 'cyan' as const,
    };
  }, [isOverCalorieTarget, calPercentage, t]);

  return (
    <GlassCard
      id="circular-calorie-protein-gauge"
      variant="card"
      className={`p-5 flex flex-col items-center justify-between space-y-4 relative overflow-hidden ${className}`}
    >
      {/* Header */}
      <div className="w-full flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-[#FF4E00]/15 text-[#FF6B2B]">
            <Flame className="w-4 h-4" />
          </div>
          <span className="text-xs font-bold uppercase tracking-wider text-neutral-300">
            {t('dashboard.dailyMetabolicBalance') || 'Daily Metabolic Progress'}
          </span>
        </div>
        <Badge variant={statusBadge.variant} size="sm">
          {statusBadge.label}
        </Badge>
      </div>

      {/* Circular Rings Center Stage */}
      <div className="relative flex items-center justify-center my-1" style={{ width: size, height: size }}>
        {/* Glow ambient background aura */}
        <div className="absolute inset-4 rounded-full bg-gradient-to-tr from-[#FF4E00]/10 via-[#FF8D24]/5 to-transparent blur-xl pointer-events-none" />

        <svg
          width={size}
          height={size}
          className="transform -rotate-90 origin-center filter drop-shadow-[0_4px_16px_rgba(0,0,0,0.5)]"
        >
          <defs>
            {/* Outer Calorie Ring Gradient */}
            <linearGradient id="calorieGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FF4E00" />
              <stop offset="60%" stopColor="#FF6B2B" />
              <stop offset="100%" stopColor="#FFA048" />
            </linearGradient>

            {/* Inner Protein Ring Gradient */}
            <linearGradient id="proteinGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#10B981" />
              <stop offset="60%" stopColor="#34D399" />
              <stop offset="100%" stopColor="#6EE7B7" />
            </linearGradient>

            {/* Subtle glow filter */}
            <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Outer Ring Background Track */}
          <circle
            cx={center}
            cy={center}
            r={outerRadius}
            fill="transparent"
            stroke="rgba(255, 255, 255, 0.06)"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
          />

          {/* Outer Ring Active Progress (Calories) */}
          <circle
            cx={center}
            cy={center}
            r={outerRadius}
            fill="transparent"
            stroke="url(#calorieGradient)"
            strokeWidth={strokeWidth}
            strokeDasharray={outerCircumference}
            strokeDashoffset={outerOffset}
            strokeLinecap="round"
            className="transition-all duration-1000 ease-out"
            filter="url(#glow)"
          />

          {/* Inner Ring Background Track */}
          <circle
            cx={center}
            cy={center}
            r={innerRadius}
            fill="transparent"
            stroke="rgba(255, 255, 255, 0.04)"
            strokeWidth={strokeWidth - 2}
            strokeLinecap="round"
          />

          {/* Inner Ring Active Progress (Protein) */}
          <circle
            cx={center}
            cy={center}
            r={innerRadius}
            fill="transparent"
            stroke="url(#proteinGradient)"
            strokeWidth={strokeWidth - 2}
            strokeDasharray={innerCircumference}
            strokeDashoffset={innerOffset}
            strokeLinecap="round"
            className="transition-all duration-1000 ease-out delay-150"
          />
        </svg>

        {/* Center Digital Readout */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center select-none pointer-events-none px-4">
          <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-400">
            {caloriesRemaining > 0 ? (t('dashboard.remaining') || 'Remaining') : 'Budget Filled'}
          </span>
          <span className="text-3xl sm:text-4xl font-black text-white tracking-tight my-0.5 filter drop-shadow-md">
            {formatNumber(caloriesRemaining > 0 ? caloriesRemaining : caloriesConsumed)}
          </span>
          <span className="text-[11px] font-semibold text-neutral-400">
            {t('common.kcal') || 'kcal'} / {formatNumber(calTarget)}
          </span>
          {activeCaloriesBurned > 0 && (
            <div className="flex items-center gap-1 text-[10px] text-[#FF8D24] font-bold mt-1">
              <Zap className="w-3 h-3 fill-current" />
              <span>+{formatNumber(activeCaloriesBurned)} burn</span>
            </div>
          )}
        </div>
      </div>

      {/* Dual Indicators Legend */}
      <div className="w-full grid grid-cols-2 gap-2 pt-2 border-t border-white/[0.06]">
        {/* Calories Legend */}
        <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.05] space-y-1">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#FF6B2B] shrink-0 shadow-[0_0_8px_rgba(255,107,43,0.6)]" />
              <span className="font-semibold text-neutral-300">{t('dashboard.calories') || 'Calories'}</span>
            </div>
            <span className="font-black text-neutral-200 text-xs">{calPercentage}%</span>
          </div>
          <p className="text-[11px] text-neutral-400 font-medium truncate">
            {formatNumber(caloriesConsumed)} / {formatNumber(calTarget)} kcal
          </p>
        </div>

        {/* Protein Legend */}
        <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.05] space-y-1">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shrink-0 shadow-[0_0_8px_rgba(52,211,153,0.6)]" />
              <span className="font-semibold text-neutral-300">{t('dashboard.protein') || 'Protein'}</span>
            </div>
            <span className="font-black text-emerald-400 text-xs">{protPercentage}%</span>
          </div>
          <p className="text-[11px] text-neutral-400 font-medium truncate">
            {formatGrams(proteinConsumedGrams, language)} / {formatGrams(protTarget, language)}
          </p>
        </div>
      </div>
    </GlassCard>
  );
};
