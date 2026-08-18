import React, { useState } from 'react';
import { Droplet, Plus, Minus, Check, Sparkles, RefreshCw } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useI18n } from '../../context/I18nContext';
import { useHapticFeedback } from '../../hooks/useHapticFeedback';
import { MetricsService } from '../../services/metrics';
import { formatNumber } from '../../i18n/formatters';
import { GlassCard } from '../ui/GlassCard';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';

export interface WaterTrackerProps {
  currentWaterMl: number;
  targetWaterMl: number;
  onUpdate?: () => void;
  className?: string;
}

/**
 * Water Tracker Component
 * Provides rapid one-tap logging of water intake with immediate visual feedback and haptic cues
 */
export const WaterTracker: React.FC<WaterTrackerProps> = ({
  currentWaterMl,
  targetWaterMl,
  onUpdate,
  className = '',
}) => {
  const { user } = useAuth();
  const { t, language, formatNumber } = useI18n();
  const { trigger } = useHapticFeedback();
  const [isUpdating, setIsUpdating] = useState<boolean>(false);

  const target = Math.max(500, targetWaterMl || 3000);
  const current = Math.max(0, currentWaterMl || 0);
  const percentage = Math.min(100, Math.round((current / target) * 100));

  const standardGlassMl = 250;
  const totalGlasses = Math.max(8, Math.ceil(target / standardGlassMl));
  const filledGlasses = Math.min(totalGlasses, Math.floor(current / standardGlassMl));

  const handleAddWater = async (amountMl: number) => {
    if (!user) return;
    setIsUpdating(true);
    trigger('waterLogged');

    try {
      await MetricsService.addWaterIntake(user.id, amountMl);
      if (onUpdate) {
        onUpdate();
      }
    } catch (err) {
      console.error('Error logging water intake:', err);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleQuickGlassToggle = async (index: number) => {
    if (!user) return;
    setIsUpdating(true);
    trigger('waterLogged');

    try {
      // If clicking on an active glass, set to that index * 250ml
      // If clicking next unfilled glass, add 250ml
      const targetIntake = (index + 1) * standardGlassMl;
      await MetricsService.setWaterIntake(user.id, targetIntake);
      if (onUpdate) {
        onUpdate();
      }
    } catch (err) {
      console.error('Error setting water intake:', err);
    } finally {
      setIsUpdating(false);
    }
  };

  const isGoalReached = current >= target;

  return (
    <GlassCard
      id="water-tracker-card"
      variant="card"
      className={`p-5 space-y-4 relative overflow-hidden ${className}`}
    >
      {/* Subtle blue accent background glow */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/5 rounded-full blur-2xl pointer-events-none" />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-cyan-500/15 text-cyan-400">
            <Droplet className="w-4 h-4 fill-current" />
          </div>
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-300">
              {t('dashboard.waterTracker') || 'Hydration Tracker'}
            </h3>
          </div>
        </div>

        <Badge variant={isGoalReached ? 'emerald' : 'cyan'} size="sm">
          {isGoalReached ? (
            <span className="flex items-center gap-1">
              <Check className="w-3 h-3" />
              {t('dashboard.goalMet') || 'Hydrated'}
            </span>
          ) : (
            `${percentage}%`
          )}
        </Badge>
      </div>

      {/* Main Hydration Metric & Visual Fluid Bar */}
      <div className="space-y-2">
        <div className="flex items-baseline justify-between">
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              {(current / 1000).toFixed(current % 1000 === 0 ? 1 : 2)}
            </span>
            <span className="text-xs font-semibold text-neutral-400">
              / {(target / 1000).toFixed(1)} L
            </span>
          </div>
          <span className="text-xs text-cyan-400 font-semibold">
            {formatNumber(current)} / {formatNumber(target)} ml
          </span>
        </div>

        {/* Dynamic Water Wave / Bar */}
        <div className="w-full h-3 rounded-full bg-neutral-900/80 border border-white/5 overflow-hidden p-0.5 relative">
          <div
            className="h-full rounded-full bg-gradient-to-r from-cyan-600 via-cyan-400 to-teal-300 transition-all duration-500 ease-out shadow-[0_0_12px_rgba(6,182,212,0.5)]"
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>

      {/* Interactive Glass Icons Row */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-[11px] text-neutral-400 font-medium">
          <span>Tap to log glass ({standardGlassMl}ml):</span>
          <span>{filledGlasses}/{totalGlasses} glasses</span>
        </div>

        <div className="grid grid-cols-6 sm:grid-cols-12 gap-1.5 pt-1">
          {Array.from({ length: Math.min(12, totalGlasses) }).map((_, idx) => {
            const isFilled = idx < filledGlasses;
            return (
              <button
                key={idx}
                type="button"
                id={`btn-water-glass-${idx}`}
                disabled={isUpdating}
                onClick={() => handleQuickGlassToggle(idx)}
                title={`${(idx + 1) * standardGlassMl} ml`}
                className={`h-9 rounded-xl border flex flex-col items-center justify-center transition-all duration-200 cursor-pointer active:scale-90 ${
                  isFilled
                    ? 'border-cyan-500/40 bg-cyan-500/20 text-cyan-300 shadow-[0_0_10px_rgba(6,182,212,0.25)]'
                    : 'border-white/10 bg-neutral-900/60 text-neutral-600 hover:text-neutral-300 hover:border-white/20'
                }`}
              >
                <Droplet className={`w-3.5 h-3.5 ${isFilled ? 'fill-current' : ''}`} />
                <span className="text-[9px] font-bold mt-0.5 opacity-80">
                  {idx + 1}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Quick Action Logging Buttons */}
      <div className="flex items-center gap-2 pt-1 border-t border-white/[0.06]">
        <Button
          id="btn-add-glass"
          variant="secondary"
          size="sm"
          disabled={isUpdating}
          onClick={() => handleAddWater(standardGlassMl)}
          className="flex-1"
          leftIcon={<Plus className="w-3.5 h-3.5 text-cyan-400" />}
        >
          +1 Glass (250ml)
        </Button>

        <Button
          id="btn-add-bottle"
          variant="secondary"
          size="sm"
          disabled={isUpdating}
          onClick={() => handleAddWater(500)}
          className="flex-1"
          leftIcon={<Plus className="w-3.5 h-3.5 text-cyan-400" />}
        >
          +Bottle (500ml)
        </Button>

        {current > 0 && (
          <Button
            id="btn-undo-water"
            variant="ghost"
            size="sm"
            disabled={isUpdating}
            onClick={() => handleAddWater(-standardGlassMl)}
            className="px-2.5 text-neutral-400 hover:text-neutral-200"
            title="Undo 250ml"
          >
            <Minus className="w-3.5 h-3.5" />
          </Button>
        )}
      </div>
    </GlassCard>
  );
};
