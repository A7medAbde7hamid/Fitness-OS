import React, { useEffect, useState, useCallback } from 'react';
import {
  Activity,
  Bot,
  Calendar,
  ChevronRight,
  Dumbbell,
  Flame,
  Footprints,
  HeartPulse,
  Plus,
  Scale,
  Sparkles,
  TrendingDown,
  Utensils,
  Zap,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useI18n } from '../../context/I18nContext';
import { useNavigation } from '../../context/NavigationContext';
import { useHapticFeedback } from '../../hooks/useHapticFeedback';
import { MetricsService, DashboardMetricsPayload } from '../../services/metrics';
import {
  formatCalories,
  formatGrams,
  formatNumber,
} from '../../i18n/formatters';
import { DailySummary } from '../../types';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { GlassCard } from '../ui/GlassCard';
import { MetricCard } from '../ui/MetricCard';
import { ProgressBar } from '../ui/ProgressBar';
import { SkeletonDashboard } from '../ui/LoadingSkeleton';
import { CircularProgress } from './CircularProgress';
import { WaterTracker } from './WaterTracker';
import { AskAIFloatingButton } from './AskAIFloatingButton';

export const DashboardView: React.FC = () => {
  const { user, profile, isLoading, error, isAuthenticated } = useAuth();
  const { t, language } = useI18n();
  const { setActiveTab, openQuickAction } = useNavigation();
  const { trigger } = useHapticFeedback();

  const [metrics, setMetrics] = useState<DashboardMetricsPayload | null>(null);
  const [isLoadingMetrics, setIsLoadingMetrics] = useState<boolean>(true);
  const [showErrorState, setShowErrorState] = useState<boolean>(false);
  const todayStr = new Date().toISOString().split('T')[0];

  const loadMetrics = useCallback(async () => {
    if (!user) return;
    try {
      setIsLoadingMetrics(true);
      const data = await MetricsService.getDashboardMetrics(user.id, todayStr);
      setMetrics(data);
    } catch (err) {
      console.error('Error fetching dashboard metrics:', err);
      setShowErrorState(true);
    } finally {
      setIsLoadingMetrics(false);
    }
  }, [user, todayStr]);

  useEffect(() => {
    loadMetrics();
  }, [loadMetrics]);

  const summary = metrics?.summary;
  const currentWeight = metrics?.currentWeight || profile?.currentWeightKg;
  const targetWeight = profile?.targetWeightKg;
  const weightRemaining = currentWeight !== undefined && targetWeight !== undefined
    ? Math.max(0, currentWeight - targetWeight)
    : undefined;
  const weightProgressPercent = currentWeight !== undefined && targetWeight !== undefined && currentWeight > 0
    ? Math.min(100, ((currentWeight - targetWeight) / currentWeight) * 100)
    : undefined;
  const dailyCalorieTarget = profile?.dailyCalorieTarget;
  const caloriesConsumed = summary?.caloriesConsumed || 0;
  const proteinConsumed = summary?.proteinConsumedGrams || 0;
  const activeMinutes = summary?.activeMinutes || 0;
  const steps = summary?.steps || 0;
  const stepTarget = profile?.dailyStepTarget || 10000;
  const caloriesTarget = dailyCalorieTarget || 2150;
  const proteinTarget = profile?.dailyProteinTargetGrams || 160;

  const readinessScore = metrics?.readinessScore;
  let recoveryStatus: string;
  if (readinessScore === undefined) {
    recoveryStatus = 'unknown';
  } else if (readinessScore >= 80) {
    recoveryStatus = 'recovered';
  } else if (readinessScore >= 60) {
    recoveryStatus = 'ready';
  } else {
    recoveryStatus = 'fatigued';
  }

  const handleRetry = () => {
    setShowErrorState(false);
    loadMetrics();
    trigger('light');
  };

  if (isLoading) {
    return <SkeletonDashboard />;
  }

  if (!isAuthenticated) {
    return null;
  }

  if (error && !showErrorState) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8">
        <div className="text-center">
          <h2 className="text-xl font-bold text-[#FF4E00] mb-4">
            {t('auth.loginError')}
          </h2>
          <p className="text-neutral-400 mb-6">{error}</p>
          <Button variant="primary" onClick={() => {}}>
            {t('auth.tryAgain')}
          </Button>
        </div>
      </div>
    );
  }

  if (showErrorState) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] p-6">
        <GlassCard variant="card" className="m-4 p-6 max-w-2xl w-full">
          <h2 className="text-xl font-bold text-[#FF4E00] mb-4">
            {t('dashboard.errorTitle')}
          </h2>
          <p className="text-neutral-400 mb-6">{t('dashboard.errorMessage')}</p>
          <div className="flex gap-3">
            <Button variant="primary" onClick={handleRetry} className="flex-1">
              {t('dashboard.retry')}
            </Button>
            <Button variant="secondary" onClick={() => { setShowErrorState(false); }}>
              {t('dashboard.cancel')}
            </Button>
          </div>
        </GlassCard>
      </div>
    );
  }

  return (
    <div id="dashboard-view" className="space-y-6 pb-12 relative">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4 pb-4">
        <MetricCard
          id="card-metric-weight"
          label={t('dashboard.currentWeight')}
          value={currentWeight !== undefined ? `${Number(currentWeight).toFixed(1)} kg` : t('dashboard.noData')}
          target={targetWeight !== undefined ? `${Number(targetWeight).toFixed(1)} kg` : undefined}
          progressPercentage={weightProgressPercent}
          trendText={weightRemaining !== undefined ? `-${weightRemaining} kg this week` : undefined}
          icon={<Scale className="w-4 h-4" />}
        />

        {targetWeight !== undefined ? (
          <MetricCard
            id="card-metric-target-weight"
            label={t('dashboard.targetWeight')}
            value={`${Number(targetWeight).toFixed(1)} kg`}
            target={currentWeight !== undefined ? `${(currentWeight - targetWeight).toFixed(1)} kg diff` : undefined}
            progressPercentage={weightProgressPercent}
            trendText={weightRemaining !== undefined ? `-${weightRemaining} kg remaining` : undefined}
            icon={<Zap className="w-4 h-4 text-amber-400" />}
          />
        ) : (
          <MetricCard
            id="card-metric-target-weight"
            label={t('dashboard.targetWeight')}
            value={t('dashboard.noData')}
            icon={<Zap className="w-4 h-4 text-amber-400" />}
          />
        )}

        <MetricCard
          id="card-metric-calories"
          label={t('dashboard.caloriesConsumed')}
          value={formatCalories(caloriesConsumed, language)}
          target={caloriesTarget > 0 ? formatCalories(caloriesTarget, language) : '—'}
          progressPercentage={caloriesTarget > 0 ? (caloriesConsumed / caloriesTarget) * 100 : undefined}
          trendText={`+${activeMinutes} active mins`}
          icon={<Flame className="w-4 h-4 text-[#FF6B2B]" />}
        />

        <MetricCard
          id="card-metric-protein"
          label={t('dashboard.proteinConsumed')}
          value={formatGrams(proteinConsumed, language)}
          target={proteinTarget > 0 ? formatGrams(proteinTarget, language) : '—'}
          progressPercentage={proteinTarget > 0 ? (proteinConsumed / proteinTarget) * 100 : undefined}
          icon={<Bot className="w-4 h-4 text-emerald-400" />}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        <GlassCard variant="card" className="p-5 lg:p-6 space-y-4">
          <h3 className="text-sm font-bold text-neutral-400 uppercase tracking-wider mb-3">
            {t('dashboard.caloricOverview')}
          </h3>

          <CircularProgress
            caloriesConsumed={caloriesConsumed}
            caloriesTarget={caloriesTarget}
            proteinConsumedGrams={proteinConsumed}
            proteinTargetGrams={proteinTarget}
            carbsConsumedGrams={summary?.carbsConsumedGrams || 0}
            carbsTargetGrams={profile?.dailyCarbsTargetGrams || 210}
            fatConsumedGrams={summary?.fatConsumedGrams || 0}
            fatTargetGrams={profile?.dailyFatTargetGrams || 65}
            activeCaloriesBurned={summary?.activeCalories || 380}
            className="h-48"
          />

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4">
            <div className="space-y-2 p-3 rounded bg-neutral-900/80 border border-white/5">
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="text-neutral-300">{t('dashboard.protein')}</span>
                <span className="text-emerald-400 font-bold">
                  {formatGrams(proteinConsumed, language)}
                </span>
              </div>
              <ProgressBar value={proteinConsumed} max={proteinTarget} color="emerald" height="sm" />
              <p className="text-[10px] text-neutral-400">Target: {formatGrams(proteinTarget, language)}</p>
            </div>

            <div className="space-y-2 p-3 rounded bg-neutral-900/80 border border-white/5">
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="text-neutral-300">{t('dashboard.carbs')}</span>
                <span className="text-cyan-400 font-bold">
                  {formatGrams(summary?.carbsConsumedGrams || 0, language)}
                </span>
              </div>
              <ProgressBar value={summary?.carbsConsumedGrams || 0} max={profile?.dailyCarbsTargetGrams || 210} color="cyan" height="sm" />
              <p className="text-[10px] text-neutral-400">Target: {formatGrams(profile?.dailyCarbsTargetGrams || 210, language)}</p>
            </div>

            <div className="space-y-2 p-3 rounded bg-neutral-900/80 border border-white/5">
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="text-neutral-300">{t('dashboard.fat')}</span>
                <span className="text-amber-400 font-bold">
                  {formatGrams(summary?.fatConsumedGrams || 0, language)}
                </span>
              </div>
              <ProgressBar value={summary?.fatConsumedGrams || 0} max={profile?.dailyFatTargetGrams || 65} color="amber" height="sm" />
              <p className="text-[10px] text-neutral-400">Target: {formatGrams(profile?.dailyFatTargetGrams || 65, language)}</p>
            </div>
          </div>
        </GlassCard>

        <WaterTracker
          currentWaterMl={summary?.waterMl || 2100}
          targetWaterMl={profile?.dailyWaterTargetMl || 3000}
          onUpdate={loadMetrics}
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <MetricCard
            id="card-metric-steps"
            label={t('dashboard.steps')}
            value={formatNumber(steps, language)}
            target={formatNumber(stepTarget, language)}
            progressPercentage={(steps / stepTarget) * 100}
            icon={<Footprints className="w-4 h-4" />}
          />
          <MetricCard
            id="card-metric-active-mins"
            label={t('dashboard.activeMins')}
            value={`${activeMinutes} ${t('common.minutes')}`}
            target="45 mins"
            progressPercentage={93}
            icon={<Activity className="w-4 h-4 text-amber-400" />}
          />
        </div>
      </div>

      <GlassCard variant="card" className="p-5 lg:p-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-neutral-900/80 border border-white/5 flex items-center justify-center text-sm">
            {recoveryStatus === 'recovered' ? (
              <Bot className="w-5 h-5 text-emerald-400" />
            ) : recoveryStatus === 'ready' ? (
              <HeartPulse className="w-5 h-5 text-amber-400" />
            ) : (
              <Zap className="w-5 h-5 text-amber-400" />
            )}
          </div>
          <div>
            <p className="text-base font-medium text-white">
              {t('dashboard.' + recoveryStatus + 'Score')}
            </p>
            <p className="text-xs text-neutral-400">
              {recoveryStatus === 'recovered' ? t('dashboard.readinessHigh') : recoveryStatus === 'ready' ? t('dashboard.readinessMedium') : t('dashboard.readinessLow')}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 pt-3 border-t border-white/5">
          <div className="w-8 h-8 rounded-xl bg-[#FF4E00]/15 text-[#FF6B2B] flex items-center justify-center font-bold text-sm">
            {summary?.workoutCompleted || 0}
          </div>
          <div>
            <p className="text-base font-medium text-white">
              {t('dashboard.workoutsCompleted')}
            </p>
            <p className="text-xs text-neutral-400">
              {summary?.workoutCompleted ? '1 completed today' : 'No workouts today'}
            </p>
          </div>
        </div>
      </GlassCard>

      <div className="space-y-2">
        <span className="text-xs font-bold uppercase tracking-wider text-neutral-400">
          {t('dashboard.quickActions')}
        </span>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
          <Button
            id="btn-quick-weight"
            variant="secondary"
            size="md"
            onClick={() => { trigger('light'); setActiveTab('log'); openQuickAction('weight'); }}
            leftIcon={<Scale className="w-4 h-4 text-white" />}
          >
            {t('dashboard.logWeight')}
          </Button>
          <Button
            id="btn-quick-activity"
            variant="secondary"
            size="md"
            onClick={() => { trigger('light'); setActiveTab('log'); openQuickAction('activity'); }}
            leftIcon={<Activity className="w-4 h-4 text-amber-400" />}
          >
            {t('dashboard.logActivity')}
          </Button>
          <Button
            id="btn-quick-meal"
            variant="secondary"
            size="md"
            onClick={() => { trigger('light'); setActiveTab('log'); openQuickAction('meal'); }}
            leftIcon={<Utensils className="w-4 h-4 text-[#FF6B2B]" />}
          >
            {t('dashboard.addMeal')}
          </Button>
          <Button
            id="btn-quick-workout"
            variant="secondary"
            size="md"
            onClick={() => { trigger('light'); setActiveTab('log'); openQuickAction('workout'); }}
            leftIcon={<Dumbbell className="w-4 h-4 text-[#FF8D24]" />}
          >
            {t('dashboard.startWorkout')}
          </Button>
          <Button
            id="btn-quick-coach"
            variant="glow"
            size="md"
            onClick={() => { trigger('medium'); setActiveTab('coach'); }}
            leftIcon={<Bot className="w-4 h-4 fill-current" />}
            className="col-span-2 sm:col-span-1"
          >
            {t('dashboard.askCoach')}
          </Button>
        </div>
      </div>

      <AskAIFloatingButton onActionCompleted={loadMetrics} />
    </div>
  );
};