import React, { useState } from 'react';
import {
  Activity,
  Camera,
  CheckCircle2,
  Dumbbell,
  FileText,
  Plus,
  Scale,
  Sparkles,
  Utensils,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useI18n } from '../../context/I18nContext';
import { useHapticFeedback } from '../../hooks/useHapticFeedback';
import { AppStorageRepository } from '../../db/storage';
import { formatCalories } from '../../i18n/formatters';
import { Meal, MealType } from '../../types';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { GlassCard } from '../ui/GlassCard';
import { Input } from '../ui/Input';

export const LogView: React.FC = () => {
  const { user, profile } = useAuth();
  const { t, language } = useI18n();
  const { trigger } = useHapticFeedback();

  const [activeSubTab, setActiveSubTab] = useState<'meal' | 'weight' | 'activity' | 'workout'>('meal');
  
  // Meal Form State
  const [mealText, setMealText] = useState('');
  const [mealType, setMealType] = useState<MealType>('lunch');
  const [analyzingMeal, setAnalyzingMeal] = useState(false);
  const [proposedMeal, setProposedMeal] = useState<Meal | null>(null);
  const [mealSaved, setMealSaved] = useState(false);

  // Weight Form State
  const [weightInput, setWeightInput] = useState<number>(profile?.currentWeightKg || 74);
  const [weightSaved, setWeightSaved] = useState(false);

  // Activity Form State
  const [activitySteps, setActivitySteps] = useState<number>(8500);
  const [activityMins, setActivityMins] = useState<number>(45);
  const [activitySaved, setActivitySaved] = useState(false);

  // Workout state
  const [workoutCompleted, setWorkoutCompleted] = useState(false);

  // AI Meal Analysis Simulator
  const handleAnalyzeMeal = () => {
    if (!mealText.trim() || !user) return;
    trigger('light');
    setAnalyzingMeal(true);
    setMealSaved(false);

    setTimeout(() => {
      // Simulate deterministic breakdown with high confidence
      const newMeal: Meal = {
        id: 'meal_' + Date.now(),
        userId: user.id,
        mealType,
        loggedAt: new Date().toISOString(),
        items: [
          {
            name: mealText,
            portion: '1 plate',
            grams: 350,
            calories: 540,
            protein: 42,
            carbs: 65,
            fat: 12,
            confidence: 0.94,
          },
        ],
        totalCalories: 540,
        totalProtein: 42,
        totalCarbs: 65,
        totalFat: 12,
        aiAnalyzed: true,
        aiConfidence: 0.94,
        userConfirmed: false,
      };
      setProposedMeal(newMeal);
      setAnalyzingMeal(false);
      trigger('medium');
    }, 600);
  };

  const handleConfirmMeal = () => {
    if (!proposedMeal || !user) return;
    trigger('mealLogged');
    const existing = AppStorageRepository.getMeals(user.id);
    const confirmed: Meal = { ...proposedMeal, userConfirmed: true };
    AppStorageRepository.saveMeals(user.id, [confirmed, ...existing]);
    setMealSaved(true);
    setProposedMeal(null);
    setMealText('');
  };

  const handleSaveWeight = () => {
    if (!user) return;
    trigger('success');
    AppStorageRepository.addMeasurement(user.id, {
      id: 'meas_' + Date.now(),
      userId: user.id,
      weightKg: Number(weightInput),
      measuredAt: new Date().toISOString(),
      notes: 'Quick manual log',
    });
    setWeightSaved(true);
    setTimeout(() => setWeightSaved(false), 3000);
  };

  const handleSaveActivity = () => {
    if (!user) return;
    trigger('success');
    const existing = AppStorageRepository.getActivities(user.id);
    AppStorageRepository.saveActivities(user.id, [
      {
        id: 'act_' + Date.now(),
        userId: user.id,
        activityType: 'walking',
        durationMinutes: activityMins,
        caloriesBurned: Math.round(activityMins * 7.5),
        steps: activitySteps,
        loggedAt: new Date().toISOString(),
        source: 'manual',
      },
      ...existing,
    ]);
    setActivitySaved(true);
    setTimeout(() => setActivitySaved(false), 3000);
  };

  const handleMarkWorkoutComplete = () => {
    if (!user) return;
    trigger('workoutCompleted');
    setWorkoutCompleted(true);
    const existingWorkouts = AppStorageRepository.getWorkouts(user.id);
    AppStorageRepository.saveWorkouts(user.id, [
      {
        id: 'wkt_' + Date.now(),
        userId: user.id,
        title: 'Upper Body Push Session',
        category: 'Strength Hypertrophy',
        completed: true,
        startedAt: new Date().toISOString(),
        completedAt: new Date().toISOString(),
        durationMinutes: 45,
        caloriesBurned: 320,
        exercises: [
          {
            id: 'ex_1',
            name: 'Barbell Bench Press',
            category: 'chest',
            targetSets: 4,
            targetReps: 8,
            restSeconds: 90,
            sets: [
              { setNumber: 1, reps: 8, weightKg: 80, completed: true },
              { setNumber: 2, reps: 8, weightKg: 80, completed: true },
              { setNumber: 3, reps: 8, weightKg: 80, completed: true },
              { setNumber: 4, reps: 8, weightKg: 80, completed: true },
            ],
          },
          {
            id: 'ex_2',
            name: 'Incline DB Press',
            category: 'chest',
            targetSets: 3,
            targetReps: 10,
            restSeconds: 75,
            sets: [
              { setNumber: 1, reps: 10, weightKg: 28, completed: true },
              { setNumber: 2, reps: 10, weightKg: 28, completed: true },
              { setNumber: 3, reps: 10, weightKg: 28, completed: true },
            ],
          },
          {
            id: 'ex_3',
            name: 'Triceps Pushdown',
            category: 'arms',
            targetSets: 3,
            targetReps: 12,
            restSeconds: 60,
            sets: [
              { setNumber: 1, reps: 12, weightKg: 25, completed: true },
              { setNumber: 2, reps: 12, weightKg: 25, completed: true },
              { setNumber: 3, reps: 12, weightKg: 25, completed: true },
            ],
          },
        ],
      },
      ...existingWorkouts,
    ]);
  };

  return (
    <div id="log-view" className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-black text-white tracking-tight">
          {language === 'ar' ? 'تسجيل البيانات اليومية' : 'Daily Fitness & Nutrition Log'}
        </h1>
        <p className="text-xs sm:text-sm text-slate-400">
          {language === 'ar'
            ? 'سجل وجباتك، وزنك، ونشاطك لتمكين المدرب الذكي من تحديث توصياته.'
            : 'Log your meals, bodyweight, and activities to keep your coach aligned.'}
        </p>
      </div>

      {/* Sub Tab Switcher */}
      <div className="grid grid-cols-4 p-1 rounded-2xl bg-neutral-900/90 border border-white/10">
        {[
          { id: 'meal', label: t('dashboard.addMeal'), icon: <Utensils className="w-4 h-4" /> },
          { id: 'weight', label: t('dashboard.logWeight'), icon: <Scale className="w-4 h-4" /> },
          { id: 'activity', label: t('dashboard.logActivity'), icon: <Activity className="w-4 h-4" /> },
          { id: 'workout', label: t('dashboard.startWorkout'), icon: <Dumbbell className="w-4 h-4" /> },
        ].map((tab) => (
          <button
            key={tab.id}
            id={`subtab-log-${tab.id}`}
            onClick={() => setActiveSubTab(tab.id as typeof activeSubTab)}
            className={`py-2.5 px-2 rounded-xl text-xs font-bold transition-all flex flex-col sm:flex-row items-center justify-center gap-1.5 ${
              activeSubTab === tab.id
                ? 'bg-[#FF4E00] text-white shadow-md shadow-[#FF4E00]/25'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            {tab.icon}
            <span className="truncate">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* MEAL LOGGING TAB */}
      {activeSubTab === 'meal' && (
        <GlassCard variant="card" className="p-5 sm:p-7 space-y-5">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#FF6B2B]" />
              <span>{language === 'ar' ? 'تحليل الوجبة الذكي' : 'AI Food & Nutrition Analysis'}</span>
            </h3>
            <Badge variant="cyan">Confidence Review</Badge>
          </div>

          {/* Meal Type selector */}
          <div className="grid grid-cols-4 gap-2">
            {(['breakfast', 'lunch', 'dinner', 'snack'] as const).map((type) => (
              <button
                key={type}
                onClick={() => setMealType(type)}
                className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                  mealType === type
                    ? 'border-[#FF4E00] bg-[#FF4E00]/15 text-[#FF8D24]'
                    : 'border-white/10 bg-neutral-900/60 text-neutral-400'
                }`}
              >
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </button>
            ))}
          </div>

          <div className="space-y-3">
            <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-400">
              {language === 'ar' ? 'ماذا تناولت؟' : 'What did you eat?'}
            </label>
            <div className="relative">
              <textarea
                id="textarea-meal-text"
                rows={3}
                value={mealText}
                onChange={(e) => setMealText(e.target.value)}
                placeholder={
                  language === 'ar'
                    ? 'اكتب تفاصيل الوجبة، مثلاً: "200 جم صدر دجاج مع طبق أرز وسلطة"'
                    : 'Describe your meal, e.g. "Grilled chicken breast 200g with a cup of brown rice and steamed broccoli"'
                }
                className="w-full rounded-xl p-3.5 text-sm glass-input placeholder:text-neutral-500 resize-none"
              />
            </div>

            <div className="flex items-center justify-between gap-3">
              <Button
                id="btn-photo-meal"
                variant="secondary"
                size="md"
                type="button"
                leftIcon={<Camera className="w-4 h-4 text-white" />}
                onClick={() => setMealText('2 eggs with avocado toast and black coffee')}
              >
                {language === 'ar' ? 'صورة الوجبة' : 'Photo Snap'}
              </Button>

              <Button
                id="btn-analyze-meal"
                variant="primary"
                size="md"
                disabled={!mealText.trim()}
                isLoading={analyzingMeal}
                onClick={handleAnalyzeMeal}
                rightIcon={<Sparkles className="w-4 h-4" />}
                className="flex-1"
              >
                {language === 'ar' ? 'تحليل بالذكاء الاصطناعي' : 'Analyze Nutrition'}
              </Button>
            </div>
          </div>

          {/* AI Proposed Nutrition Review */}
          {proposedMeal && (
            <div className="p-4 rounded-xl bg-neutral-900/90 border border-[#FF4E00]/40 space-y-4 animate-in fade-in duration-300">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#FF6B2B] uppercase tracking-wider">
                  {language === 'ar' ? 'القيم الغذائية التقديرية (درجة الثقة: 94%)' : 'Estimated Nutrition (94% Confidence)'}
                </span>
                <Badge variant="emerald">Review & Confirm</Badge>
              </div>

              <div className="grid grid-cols-4 gap-2 text-center">
                <div className="p-2.5 rounded-lg bg-neutral-950 border border-white/5">
                  <span className="text-[10px] text-neutral-400 block">Calories</span>
                  <span className="text-sm font-bold text-white">{proposedMeal.totalCalories}</span>
                </div>
                <div className="p-2.5 rounded-lg bg-neutral-950 border border-white/5">
                  <span className="text-[10px] text-neutral-400 block">Protein</span>
                  <span className="text-sm font-bold text-[#FF8D24]">{proposedMeal.totalProtein}g</span>
                </div>
                <div className="p-2.5 rounded-lg bg-neutral-950 border border-white/5">
                  <span className="text-[10px] text-neutral-400 block">Carbs</span>
                  <span className="text-sm font-bold text-neutral-200">{proposedMeal.totalCarbs}g</span>
                </div>
                <div className="p-2.5 rounded-lg bg-neutral-950 border border-white/5">
                  <span className="text-[10px] text-neutral-400 block">Fat</span>
                  <span className="text-sm font-bold text-amber-400">{proposedMeal.totalFat}g</span>
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  id="btn-confirm-meal"
                  variant="glow"
                  size="md"
                  onClick={handleConfirmMeal}
                  leftIcon={<CheckCircle2 className="w-4 h-4" />}
                  className="w-full"
                >
                  {language === 'ar' ? 'تأكيد وحفظ الوجبة' : 'Confirm & Save Meal'}
                </Button>
              </div>
            </div>
          )}

          {mealSaved && (
            <div className="p-3 rounded-xl bg-[#FF4E00]/10 border border-[#FF4E00]/30 text-[#FF8D24] text-xs font-semibold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              <span>{t('common.success')}</span>
            </div>
          )}
        </GlassCard>
      )}

      {/* WEIGHT LOGGING TAB */}
      {activeSubTab === 'weight' && (
        <GlassCard variant="card" className="p-5 sm:p-7 space-y-5">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Scale className="w-4 h-4 text-[#FF6B2B]" />
            <span>{language === 'ar' ? 'تسجيل وزن اليوم' : 'Log Today’s Bodyweight'}</span>
          </h3>

          <div className="space-y-4 max-w-md">
            <Input
              id="input-weight-log"
              type="number"
              label={`Measured Weight (${profile?.unitSystem === 'imperial' ? 'lbs' : 'kg'})`}
              value={weightInput}
              onChange={(e) => setWeightInput(Number(e.target.value))}
              leftIcon={<Scale className="w-4 h-4" />}
              step={0.1}
            />

            <Button
              id="btn-save-weight"
              variant="primary"
              size="md"
              onClick={handleSaveWeight}
              className="w-full"
            >
              {language === 'ar' ? 'حفظ الوزن وتحديث المتوسط الأسبوعي' : 'Save & Recalculate 7-Day Trend'}
            </Button>

            {weightSaved && (
              <div className="p-3 rounded-xl bg-[#FF4E00]/10 border border-[#FF4E00]/30 text-[#FF8D24] text-xs font-semibold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                <span>{language === 'ar' ? 'تم تسجيل الوزن بنجاح' : 'Weight measurement logged successfully!'}</span>
              </div>
            )}
          </div>
        </GlassCard>
      )}

      {/* ACTIVITY LOGGING TAB */}
      {activeSubTab === 'activity' && (
        <GlassCard variant="card" className="p-5 sm:p-7 space-y-5">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Activity className="w-4 h-4 text-amber-400" />
            <span>{language === 'ar' ? 'تسجيل النشاط والخطوات' : 'Log Daily Activity & Movement'}</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              id="input-activity-steps"
              type="number"
              label="Daily Steps"
              value={activitySteps}
              onChange={(e) => setActivitySteps(Number(e.target.value))}
            />
            <Input
              id="input-activity-mins"
              type="number"
              label="Active Minutes"
              value={activityMins}
              onChange={(e) => setActivityMins(Number(e.target.value))}
            />
          </div>

          <Button
            id="btn-save-activity"
            variant="primary"
            size="md"
            onClick={handleSaveActivity}
            className="w-full"
          >
            {language === 'ar' ? 'حفظ النشاط اليومي' : 'Save Activity'}
          </Button>

          {activitySaved && (
            <div className="p-3 rounded-xl bg-[#FF4E00]/10 border border-[#FF4E00]/30 text-[#FF8D24] text-xs font-semibold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              <span>{language === 'ar' ? 'تم حفظ النشاط بنجاح' : 'Activity recorded!'}</span>
            </div>
          )}
        </GlassCard>
      )}

      {/* WORKOUT TAB */}
      {activeSubTab === 'workout' && (
        <GlassCard variant="card" className="p-5 sm:p-7 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Dumbbell className="w-4 h-4 text-[#FF8D24]" />
              <span>Upper Body Push Session</span>
            </h3>
            <Badge variant="cyan">45 mins</Badge>
          </div>
          <p className="text-xs text-neutral-400">
            {language === 'ar'
              ? 'تمرين مخصص لهدفك الحالي. تم إعداده للتركيز على الصدر والترايسبس.'
              : 'Targeted session designed for upper body hypertrophy.'}
          </p>

          <div className="space-y-2 pt-2">
            <div className="p-3 rounded-xl bg-neutral-900/80 border border-white/5 flex items-center justify-between">
              <span className="text-xs font-bold text-neutral-200">1. Barbell Bench Press</span>
              <span className="text-xs text-[#FF6B2B] font-semibold">4 sets × 8 reps (80 kg)</span>
            </div>
            <div className="p-3 rounded-xl bg-neutral-900/80 border border-white/5 flex items-center justify-between">
              <span className="text-xs font-bold text-neutral-200">2. Incline DB Press</span>
              <span className="text-xs text-[#FF6B2B] font-semibold">3 sets × 10 reps (28 kg)</span>
            </div>
            <div className="p-3 rounded-xl bg-neutral-900/80 border border-white/5 flex items-center justify-between">
              <span className="text-xs font-bold text-neutral-200">3. Triceps Pushdown</span>
              <span className="text-xs text-[#FF6B2B] font-semibold">3 sets × 12 reps (25 kg)</span>
            </div>
          </div>

          <div className="pt-2">
            <Button
              id="btn-complete-workout"
              variant={workoutCompleted ? 'secondary' : 'primary'}
              size="md"
              onClick={handleMarkWorkoutComplete}
              disabled={workoutCompleted}
              className="w-full"
              leftIcon={workoutCompleted ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <Dumbbell className="w-4 h-4" />}
            >
              {workoutCompleted
                ? (language === 'ar' ? 'تم إكمال التمرين وتثبيت السجلات!' : 'Workout Marked as Complete! 🎉')
                : (language === 'ar' ? 'تسجيل إتمام التمرين' : 'Mark Workout Complete')}
            </Button>
          </div>
        </GlassCard>
      )}
    </div>
  );
};
