import React, { useState, useEffect, useCallback } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Pause,
  Play,
  Plus,
  Target,
  TrendingDown,
  TrendingUp,
  XCircle,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useI18n } from '../../context/I18nContext';
import { useHapticFeedback } from '../../hooks/useHapticFeedback';
import { AppStorageRepository } from '../../db/storage';
import { GoalService, GoalCategory } from '../../services/goal';
import { GoalCalculationsService, GoalProgress } from '../../services/goalCalculations';
import { Goal } from '../../types';
import { Button } from '../ui/Button';
import { GlassCard } from '../ui/GlassCard';
import { Input } from '../ui/Input';
import { ProgressBar } from '../ui/ProgressBar';

interface GoalManagementViewProps {
  onClose?: () => void;
  onGoalChange?: () => void;
}

const WARNING_LABELS: Record<string, { en: string; ar: string }> = {
  WEIGHT_LOSS_TOO_FAST: { en: 'Losing weight too fast (>1 kg/week)', ar: 'فقدان الوزن بسرعة (>1 كجم/أسبوع)' },
  SUSTAINED_FAST_LOSS: { en: 'Sustained fast loss for 2+ weeks', ar: 'فقدان سريع مستمر لأكثر من أسبوعين' },
  WEIGHT_GAIN_TOO_FAST: { en: 'Gaining weight too fast (>0.75 kg/week)', ar: 'زيادة الوزن بسرعة (>0.75 كجم/أسبوع)' },
  EXTREME_WEIGHT: { en: 'Weight reading seems extreme', ar: 'قراءة الوزن تبدو غير طبيعية' },
  HIGH_WEIGHT_VARIABILITY: { en: 'High daily weight variability detected', ar: 'تم اكتشاف تقلبات مرتفعة في الوزن اليومي' },
};

export const GoalManagementView: React.FC<GoalManagementViewProps> = ({ onClose, onGoalChange }) => {
  const { user } = useAuth();
  const { language } = useI18n();
  const { trigger } = useHapticFeedback();
  const isAr = language === 'ar';

  const [goals, setGoals] = useState<Goal[]>([]);
  const [activeGoal, setActiveGoal] = useState<Goal | null>(null);
  const [progress, setProgress] = useState<GoalProgress | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [confirmAction, setConfirmAction] = useState<{ type: 'pause' | 'abandon'; goalId: string; title: string } | null>(null);

  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState<GoalCategory>('weight');
  const [newTargetValue, setNewTargetValue] = useState<number>(70);
  const [newTargetDate, setNewTargetDate] = useState(
    new Date(Date.now() + 90 * 86400000).toISOString().split('T')[0]
  );

  const refreshData = useCallback(() => {
    if (!user) return;
    const allGoals = GoalService.getAllGoals(user.id);
    const active = GoalService.getActiveGoal(user.id);
    setGoals(allGoals);
    setActiveGoal(active);
    if (active) {
      const measurements = AppStorageRepository.getMeasurements(user.id);
      const prog = GoalCalculationsService.calculateGoalProgress(active, measurements);
      setProgress(prog);
    } else {
      setProgress(null);
    }
    onGoalChange?.();
  }, [user, onGoalChange]);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  const handleCreateGoal = () => {
    if (!user) return;
    try {
      trigger('success');
      const measurements = AppStorageRepository.getMeasurements(user.id);
      const startValue = measurements.length > 0 ? measurements[0].weightKg : 74;

      GoalService.createGoal({
        userId: user.id,
        title: newTitle || `${isAr ? 'هدف الوزن' : 'Weight Goal'}`,
        category: newCategory,
        metricType: newCategory === 'weight' ? 'weight_kg' : newCategory,
        startValue,
        targetValue: newTargetValue,
        targetDate: newTargetDate,
      });
      setShowCreateForm(false);
      refreshData();
    } catch (err) {
      if (err instanceof Error && err.message === 'ACTIVE_GOAL_EXISTS') {
        trigger('error');
      }
    }
  };

  const handlePauseGoal = () => {
    if (!user || !activeGoal) return;
    setConfirmAction({ type: 'pause', goalId: activeGoal.id, title: activeGoal.title });
  };

  const handleConfirmAction = () => {
    if (!user || !confirmAction) return;
    if (confirmAction.type === 'pause') {
      trigger('light');
      GoalService.pauseGoal(user.id, confirmAction.goalId);
    } else if (confirmAction.type === 'abandon') {
      trigger('warning');
      GoalService.abandonGoal(user.id, confirmAction.goalId);
    }
    setConfirmAction(null);
    refreshData();
  };

  const handleResumeGoal = (goalId: string) => {
    if (!user) return;
    try {
      trigger('light');
      GoalService.resumeGoal(user.id, goalId);
      refreshData();
    } catch (err) {
      if (err instanceof Error && err.message === 'ACTIVE_GOAL_EXISTS') {
        trigger('error');
      }
    }
  };

  const handleAbandonGoal = () => {
    if (!user || !activeGoal) return;
    setConfirmAction({ type: 'abandon', goalId: activeGoal.id, title: activeGoal.title });
  };

  const handleUpdateProgress = (value: number) => {
    if (!user || !activeGoal) return;
    trigger('success');
    GoalService.updateGoalProgress(user.id, activeGoal.id, value);
    refreshData();
  };

  const getWarningLabel = (code: string): string => {
    const labels = WARNING_LABELS[code];
    return labels ? (isAr ? labels.ar : labels.en) : code;
  };

  const fmt = (n: number): string => {
    return isAr ? n.toLocaleString('ar-SA', { maximumFractionDigits: 1 }) : n.toLocaleString('en-US', { maximumFractionDigits: 1 });
  };

  return (
    <div id="goal-management-view" className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <Target className="w-6 h-6 text-[#FF6B2B]" />
            {isAr ? 'إدارة الأهداف' : 'Goal Management'}
          </h1>
          <p className="text-xs sm:text-sm text-slate-400">
            {isAr ? 'تتبع وتيرة تقدمك وتحقيق أهدافك' : 'Track your progress and achieve your goals'}
          </p>
        </div>
        {onClose && (
          <Button variant="ghost" size="sm" onClick={onClose}>
            {isAr ? 'إغلاق' : 'Close'}
          </Button>
        )}
      </div>

      {activeGoal && progress ? (
        <GlassCard variant="card" className="p-5 sm:p-7 space-y-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-[#FF4E00]/20 flex items-center justify-center">
                <Target className="w-4 h-4 text-[#FF6B2B]" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">{activeGoal.title}</h3>
                <span className="text-[10px] text-neutral-400 uppercase tracking-wider">
                  {isAr ? 'هدف نشط' : 'Active Goal'}
                </span>
              </div>
            </div>
            <div className="flex gap-1.5">
              <button
                id="btn-pause-goal"
                onClick={handlePauseGoal}
                className="p-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 transition-colors"
                title={isAr ? 'إيقاف مؤقت' : 'Pause'}
              >
                <Pause className="w-3.5 h-3.5 text-neutral-300" />
              </button>
              <button
                id="btn-abandon-goal"
                onClick={handleAbandonGoal}
                className="p-2 rounded-lg bg-neutral-800 hover:bg-red-900/50 transition-colors"
                title={isAr ? 'إلغاء' : 'Abandon'}
              >
                <XCircle className="w-3.5 h-3.5 text-red-400" />
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-neutral-400">{isAr ? 'التقدم' : 'Progress'}</span>
              <span className="text-white font-bold">{progress.progressPercent}%</span>
            </div>
            <ProgressBar value={progress.progressPercent} max={100} color="amber" />
            <div className="flex justify-between text-[10px] text-neutral-500">
              <span>
                {isAr ? 'المتبقي' : 'Remaining'}: {fmt(progress.remainingValue)} {isAr ? 'كجم' : 'kg'}
              </span>
              <span>
                {isAr ? 'معدل يومي' : 'Daily'}: {fmt(Math.abs(progress.dailyRateOfChange))} {isAr ? 'كجم/يوم' : 'kg/day'}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 rounded-xl bg-neutral-900/80 border border-white/5 text-center">
              <span className="text-[10px] text-neutral-400 block">{isAr ? 'الأيام المتبقية' : 'Days Left'}</span>
              <span className="text-lg font-black text-white">{progress.daysRemaining}</span>
            </div>
            <div className="p-3 rounded-xl bg-neutral-900/80 border border-white/5 text-center">
              <span className="text-[10px] text-neutral-400 block">{isAr ? 'الأيام المنقضية' : 'Days Elapsed'}</span>
              <span className="text-lg font-black text-white">{progress.daysElapsed}</span>
            </div>
            <div className="p-3 rounded-xl bg-neutral-900/80 border border-white/5 text-center">
              <span className="text-[10px] text-neutral-400 block">{isAr ? 'المتوسط ٧ أيام' : '7-Day Avg'}</span>
              <span className="text-lg font-black text-white">
                {progress.rolling7DayAvg ? fmt(progress.rolling7DayAvg) : '—'}
              </span>
            </div>
            <div className="p-3 rounded-xl bg-neutral-900/80 border border-white/5 text-center">
              <span className="text-[10px] text-neutral-400 block">{isAr ? 'الاتجاه' : 'Trend'}</span>
              <span className="text-sm font-bold text-white flex items-center justify-center gap-1">
                {progress.trendDirection === 'losing' && <TrendingDown className="w-4 h-4 text-emerald-400" />}
                {progress.trendDirection === 'gaining' && <TrendingUp className="w-4 h-4 text-red-400" />}
                {progress.trendDirection === 'maintaining' && <Clock className="w-4 h-4 text-amber-400" />}
                {isAr
                  ? progress.trendDirection === 'losing' ? 'نزول' : progress.trendDirection === 'gaining' ? 'صعود' : 'ثبات'
                  : progress.trendDirection}
              </span>
            </div>
          </div>

          {progress.estimatedCompletionDate && (
            <div className={`p-3 rounded-xl border text-xs ${
              progress.isOnTrack
                ? 'bg-emerald-900/20 border-emerald-500/30 text-emerald-300'
                : 'bg-amber-900/20 border-amber-500/30 text-amber-300'
            }`}>
              <div className="flex items-center gap-2">
                {progress.isOnTrack ? <CheckCircle2 className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
                <span className="font-semibold">
                  {isAr ? 'الإنجاز المقدر' : 'Estimated completion'}: {progress.estimatedCompletionDate}
                  {!progress.isOnTrack && ` (${isAr ? 'خلف الجدول' : 'behind schedule'})`}
                </span>
              </div>
            </div>
          )}

          {progress.safetyWarnings.length > 0 && (
            <div className="space-y-2">
              {progress.safetyWarnings.map((warning) => (
                <div
                  key={warning}
                  className="p-3 rounded-xl bg-red-900/20 border border-red-500/30 text-red-300 text-xs flex items-center gap-2"
                >
                  <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                  <span className="font-semibold">{getWarningLabel(warning)}</span>
                </div>
              ))}
            </div>
          )}

          <div className="pt-2 border-t border-white/5">
            <label className="text-xs font-semibold text-neutral-400 mb-2 block">
              {isAr ? 'تحديث الوزن الحالي' : 'Update Current Weight'}
            </label>
            <div className="flex gap-2">
              <Input
                id="input-goal-progress"
                type="number"
                value={activeGoal.currentValue}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  GoalService.updateGoalProgress(user!.id, activeGoal.id, val);
                  refreshData();
                }}
                step={0.1}
                className="flex-1"
              />
              <Button
                id="btn-update-goal-progress"
                variant="secondary"
                size="md"
                onClick={() => handleUpdateProgress(activeGoal.currentValue)}
              >
                {isAr ? 'تحديث' : 'Update'}
              </Button>
            </div>
          </div>
        </GlassCard>
      ) : (
        <GlassCard variant="card" className="p-7 text-center space-y-4">
          <div className="w-16 h-16 mx-auto rounded-full bg-neutral-800 flex items-center justify-center">
            <Target className="w-8 h-8 text-neutral-500" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">
              {isAr ? 'لا يوجد هدف نشط' : 'No Active Goal'}
            </h3>
            <p className="text-xs text-neutral-400 mt-1">
              {isAr ? 'أنشئ هدفك الأول لتبدأ رحلة التتبع' : 'Create your first goal to start tracking'}
            </p>
          </div>
          <Button
            id="btn-create-first-goal"
            variant="primary"
            size="md"
            onClick={() => setShowCreateForm(true)}
            leftIcon={<Plus className="w-4 h-4" />}
          >
            {isAr ? 'إنشاء هدف' : 'Create Goal'}
          </Button>
        </GlassCard>
      )}

      {showCreateForm && (
        <GlassCard variant="card" className="p-5 sm:p-7 space-y-5">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Plus className="w-4 h-4 text-[#FF6B2B]" />
            {isAr ? 'إنشاء هدف جديد' : 'Create New Goal'}
          </h3>

          <div className="space-y-4">
            <Input
              id="input-goal-title"
              type="text"
              label={isAr ? 'عنوان الهدف' : 'Goal Title'}
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder={isAr ? 'مثال: فقدان 5 كجم' : 'e.g. Lose 5 kg'}
            />

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-2">
                {isAr ? 'فئة الهدف' : 'Goal Category'}
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(['weight', 'strength', 'endurance', 'habit', 'nutrition', 'body_fat'] as GoalCategory[]).map((cat) => (
                  <button
                    key={cat}
                    id={`goal-cat-${cat}`}
                    onClick={() => setNewCategory(cat)}
                    className={`py-2.5 px-3 rounded-xl text-xs font-bold border transition-all ${
                      newCategory === cat
                        ? 'border-[#FF4E00] bg-[#FF4E00]/15 text-[#FF8D24]'
                        : 'border-white/10 bg-neutral-900/60 text-neutral-400'
                    }`}
                  >
                    {isAr
                      ? cat === 'weight' ? 'وزن' : cat === 'strength' ? 'قوة' : cat === 'endurance' ? 'تجلد' : cat === 'habit' ? 'عادة' : cat === 'nutrition' ? 'تغذية' : 'دهون'
                      : cat.replace('_', ' ')}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Input
                id="input-goal-target"
                type="number"
                label={isAr ? 'القيمة المستهدفة' : 'Target Value'}
                value={newTargetValue}
                onChange={(e) => setNewTargetValue(Number(e.target.value))}
                step={0.1}
              />
              <Input
                id="input-goal-date"
                type="date"
                label={isAr ? 'التاريخ المستهدف' : 'Target Date'}
                value={newTargetDate}
                onChange={(e) => setNewTargetDate(e.target.value)}
              />
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <Button
              id="btn-cancel-create-goal"
              variant="secondary"
              size="md"
              onClick={() => setShowCreateForm(false)}
              className="flex-1"
            >
              {isAr ? 'إلغاء' : 'Cancel'}
            </Button>
            <Button
              id="btn-confirm-create-goal"
              variant="primary"
              size="md"
              onClick={handleCreateGoal}
              disabled={!newTitle.trim()}
              className="flex-1"
            >
              {isAr ? 'إنشاء الهدف' : 'Create Goal'}
            </Button>
          </div>
        </GlassCard>
      )}

      {goals.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-bold text-white">
            {isAr ? 'سجل الأهداف' : 'Goal History'}
          </h3>
          {goals.map((goal) => {
            const isActive = goal.status === 'in_progress';
            const isPaused = goal.status === 'paused';
            return (
              <GlassCard key={goal.id} variant="card" className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${
                      isActive ? 'bg-emerald-400' : isPaused ? 'bg-amber-400' : goal.status === 'completed' ? 'bg-blue-400' : 'bg-neutral-600'
                    }`} />
                    <div>
                      <h4 className="text-xs font-bold text-white">{goal.title}</h4>
                      <span className="text-[10px] text-neutral-400">
                        {goal.startDate} → {goal.targetDate}
                      </span>
                    </div>
                  </div>
                  <span className={`text-[10px] font-bold uppercase px-2 py-1 rounded-full ${
                    isActive ? 'bg-emerald-900/50 text-emerald-300' :
                    isPaused ? 'bg-amber-900/50 text-amber-300' :
                    goal.status === 'completed' ? 'bg-blue-900/50 text-blue-300' :
                    'bg-neutral-800 text-neutral-400'
                  }`}>
                    {goal.status === 'in_progress' ? (isAr ? 'نشط' : 'Active') :
                     goal.status === 'paused' ? (isAr ? 'متوقف' : 'Paused') :
                     goal.status === 'completed' ? (isAr ? 'مكتمل' : 'Completed') :
                     (isAr ? 'ملغي' : 'Abandoned')}
                  </span>
                </div>
                {isPaused && (
                  <div className="mt-3">
                    <Button
                      id={`btn-resume-goal-${goal.id}`}
                      variant="secondary"
                      size="sm"
                      onClick={() => handleResumeGoal(goal.id)}
                      leftIcon={<Play className="w-3 h-3" />}
                    >
                      {isAr ? 'استئناف' : 'Resume'}
                    </Button>
                  </div>
                )}
              </GlassCard>
            );
          })}
        </div>
      )}
      {confirmAction && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          role="dialog"
          aria-modal="true"
          aria-label={isAr ? 'تأكيد الإجراء' : 'Confirm action'}
          onKeyDown={(e) => { if (e.key === 'Escape') setConfirmAction(null); }}
        >
          <GlassCard variant="card" className="w-full max-w-sm p-6 space-y-4">
            <h3 className="text-base font-bold text-white">
              {confirmAction.type === 'pause'
                ? (isAr ? 'إيقاف الهدف مؤقتاً؟' : 'Pause this goal?')
                : (isAr ? 'إلغاء الهدف نهائياً؟' : 'Abandon this goal?')}
            </h3>
            <p className="text-xs text-neutral-400">
              {confirmAction.type === 'pause'
                ? (isAr ? `سيتم إيقاف "${confirmAction.title}" مؤقتاً. يمكنك استئنافه لاحقاً.` : `"${confirmAction.title}" will be paused. You can resume it later.`)
                : (isAr ? `سيتم إلغاء "${confirmAction.title}" نهائياً. لا يمكن التراجع.` : `"${confirmAction.title}" will be abandoned permanently. This cannot be undone.`)}
            </p>
            <div className="flex gap-2 pt-2">
              <Button
                id="btn-confirm-cancel"
                variant="secondary"
                size="md"
                onClick={() => setConfirmAction(null)}
                className="flex-1"
              >
                {isAr ? 'إلغاء' : 'Cancel'}
              </Button>
              <Button
                id="btn-confirm-action"
                variant={confirmAction.type === 'abandon' ? 'danger' : 'primary'}
                size="md"
                onClick={handleConfirmAction}
                className="flex-1"
              >
                {confirmAction.type === 'pause'
                  ? (isAr ? 'إيقاف' : 'Pause')
                  : (isAr ? 'إلغاء الهدف' : 'Abandon')}
              </Button>
            </div>
          </GlassCard>
        </div>
      )}
    </div>
  );
};
