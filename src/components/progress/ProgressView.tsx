import React, { useMemo } from 'react';
import {
  Activity,
  Award,
  Calendar,
  Flame,
  LineChart,
  Scale,
  Sparkles,
  Target,
  TrendingDown,
  Zap,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useI18n } from '../../context/I18nContext';
import { AppStorageRepository } from '../../db/storage';
import { formatDate, formatWeight } from '../../i18n/formatters';
import { GoalCalculationsService } from '../../services/goalCalculations';
import { Badge } from '../ui/Badge';
import { GlassCard } from '../ui/GlassCard';
import { MetricCard } from '../ui/MetricCard';
import { ProgressBar } from '../ui/ProgressBar';
import { WeightTrendChart } from './WeightTrendChart';
import { GoalManagementView } from '../goals/GoalManagementView';

export const ProgressView: React.FC = () => {
  const { user, profile } = useAuth();
  const { language } = useI18n();
  const isAr = language === 'ar';

  const measurements = useMemo(() => {
    if (!user) return [];
    return AppStorageRepository.getMeasurements(user.id);
  }, [user]);

  const currentWeight = measurements.length > 0 ? measurements[0].weightKg : profile?.currentWeightKg || 74.2;
  const targetWeight = profile?.targetWeightKg || 70.0;

  const goalSummary = useMemo(() => {
    if (!user) return null;
    return GoalCalculationsService.getGoalSummaryForDashboard(user.id);
  }, [user]);

  const progressPercent = goalSummary?.progressPercent ?? 0;

  const workoutCount = useMemo(() => {
    if (!user) return 0;
    const workouts = AppStorageRepository.getWorkouts(user.id);
    return workouts.filter((w) => w.completed).length;
  }, [user]);

  const mealCount = useMemo(() => {
    if (!user) return 0;
    return AppStorageRepository.getMeals(user.id).length;
  }, [user]);

  return (
    <div id="progress-view" className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-black text-white tracking-tight">
          {isAr ? 'مؤشرات التقدم والتحليلات' : 'Progress Analytics & Trends'}
        </h1>
        <p className="text-xs sm:text-sm text-neutral-400">
          {isAr
            ? 'تعتمد التقييمات على المتوسطات المتحركة والاتجاهات المستدامة بدلاً من التذبذب اليومي الفردي.'
            : 'Progress is measured using 7-day rolling averages and sustainable trend lines, not single-day fluctuations.'}
        </p>
      </div>

      {/* Goal Progress Banner */}
      {goalSummary?.hasGoal ? (
        <GlassCard variant="glow" className="p-6 space-y-4 border border-[#FF4E00]/30 bg-gradient-to-r from-neutral-950 via-neutral-900/90 to-[#FF4E00]/10">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-[#FF6B2B]">
                {isAr ? 'تقدم الهدف' : 'Goal Progress'}
              </span>
              <h3 className="text-lg sm:text-xl font-black text-white">
                {goalSummary.goalTitle}
              </h3>
            </div>
            <Badge variant="emerald" size="md">
              {progressPercent}%
            </Badge>
          </div>

          <ProgressBar value={progressPercent} max={100} color="emerald" height="md" />

          <div className="flex items-center justify-between text-xs text-neutral-400 pt-1">
            <span>
              {isAr ? 'المتبقي' : 'Remaining'}: {goalSummary.daysRemaining} {isAr ? 'يوم' : 'days'}
            </span>
            <span className={`font-semibold ${goalSummary.isOnTrack ? 'text-emerald-400' : 'text-amber-400'}`}>
              {goalSummary.isOnTrack
                ? (isAr ? 'على المسار' : 'On track')
                : (isAr ? 'خلف الجدول' : 'Behind schedule')}
            </span>
            <span>
              {isAr ? 'المعدل' : 'Rate'}: {Math.abs(goalSummary.dailyRate).toFixed(2)} {isAr ? 'كجم/يوم' : 'kg/day'}
            </span>
          </div>
        </GlassCard>
      ) : (
        <GlassCard variant="card" className="p-6 space-y-3 border border-white/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Target className="w-5 h-5 text-[#FF6B2B]" />
              <span className="text-sm font-bold text-white">
                {isAr ? 'لا يوجد هدف نشط' : 'No Active Goal'}
              </span>
            </div>
          </div>
          <p className="text-xs text-neutral-400">
            {isAr ? 'أنشئ هدفاً لتتبع تقدمك' : 'Create a goal to start tracking your progress'}
          </p>
        </GlassCard>
      )}

      {/* Analytics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <MetricCard
          label={isAr ? 'متوسط ٧ أيام' : '7-Day Rolling Avg'}
          value={measurements.length >= 7
            ? formatWeight(
                measurements.slice(0, 7).reduce((s, m) => s + m.weightKg, 0) / 7,
                profile?.unitSystem || 'metric',
                language
              )
            : measurements.length > 0
            ? formatWeight(currentWeight, profile?.unitSystem || 'metric', language)
            : '--'
          }
          subValue={isAr ? 'اتجاه مُسطّح' : 'Smoothed Trend'}
          icon={<Scale className="w-4 h-4" />}
        />

        <MetricCard
          label={isAr ? 'تمارين مكتملة' : 'Workouts Done'}
          value={`${workoutCount}`}
          subValue={isAr ? 'إجمالي' : 'Total'}
          icon={<Zap className="w-4 h-4 text-amber-400" />}
        />

        <MetricCard
          label={isAr ? 'وجبات مسجلة' : 'Meals Logged'}
          value={`${mealCount}`}
          subValue={isAr ? 'إجمالي' : 'Total'}
          icon={<Flame className="w-4 h-4 text-[#FF6B2B]" />}
        />
      </div>

      {/* Weight Trend Chart */}
      <WeightTrendChart />

      {/* Goal Management */}
      <GoalManagementView />

      {/* Historical Logs List */}
      <GlassCard variant="card" className="p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <LineChart className="w-4 h-4 text-[#FF6B2B]" />
            <span>{isAr ? 'سجل القياسات الأخيرة' : 'Recent Measurements'}</span>
          </h3>
          <span className="text-xs text-neutral-400">{measurements.length} {isAr ? 'قياسات' : 'logs'}</span>
        </div>

        {measurements.length === 0 ? (
          <div className="py-8 text-center text-xs text-neutral-500">
            {isAr ? 'لا توجد قياسات بعد' : 'No measurements logged yet'}
          </div>
        ) : (
          <div className="space-y-2">
            {measurements.slice(0, 6).map((m) => (
              <div
                key={m.id}
                className="p-3 rounded-xl bg-neutral-900/80 border border-white/5 flex items-center justify-between text-xs"
              >
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-[#FF6B2B]" />
                  <span className="font-semibold text-neutral-200">
                    {formatDate(m.measuredAt, language, 'medium')}
                  </span>
                  {m.notes && <span className="text-[11px] text-neutral-500 hidden sm:inline">({m.notes})</span>}
                </div>
                <span className="text-sm font-bold text-white">
                  {formatWeight(m.weightKg, profile?.unitSystem || 'metric', language)}
                </span>
              </div>
            ))}
          </div>
        )}
      </GlassCard>
    </div>
  );
};
