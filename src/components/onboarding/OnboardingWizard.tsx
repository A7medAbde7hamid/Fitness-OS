import React, { useMemo, useState } from 'react';
import {
  Activity,
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Bell,
  Calendar,
  CheckCircle2,
  HeartPulse,
  Ruler,
  Scale,
  Sparkles,
  TrendingDown,
  TrendingUp,
  User,
  Zap,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useI18n } from '../../context/I18nContext';
import { useNavigation } from '../../context/NavigationContext';
import { formatCalories, formatGrams, formatNumber } from '../../i18n/formatters';
import { calculateMetabolicTargets } from '../../services/metabolicCalculations';
import { ActivityLevel, PrimaryGoal, TrainingFrequency, UnitSystem, UserProfile } from '../../types';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { GlassCard } from '../ui/GlassCard';
import { Input } from '../ui/Input';
import { ProgressBar } from '../ui/ProgressBar';

export const OnboardingWizard: React.FC = () => {
  const { user, completeOnboarding } = useAuth();
  const { t, language, setLanguage, unitSystem, setUnitSystem } = useI18n();
  const { setActiveView, setActiveTab } = useNavigation();

  const [step, setStep] = useState<number>(1);
  const totalSteps = 4;

  // Step 1 State: Biometrics (Stored internally in Metric: kg, cm)
  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [gender, setGender] = useState<'male' | 'female' | 'other'>('male');
  const [birthYear, setBirthYear] = useState<number>(1997);
  const [heightCm, setHeightCm] = useState<number>(178);
  const [currentWeightKg, setCurrentWeightKg] = useState<number>(75);

  // Step 2 State: Goals
  const [primaryGoal, setPrimaryGoal] = useState<PrimaryGoal>('fat_loss');
  const [targetWeightKg, setTargetWeightKg] = useState<number>(70);
  const [targetDate, setTargetDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 75); // 75 days default
    return d.toISOString().split('T')[0];
  });

  // Step 3 State: Activity & Preferences
  const [activityLevel, setActivityLevel] = useState<ActivityLevel>('moderately_active');
  const [trainingFrequency, setTrainingFrequency] = useState<TrainingFrequency>(4);
  const [notificationPreference, setNotificationPreference] = useState<boolean>(true);

  // Unit display values
  const displayCurrentWeight = useMemo(() => {
    return unitSystem === 'imperial'
      ? Math.round(currentWeightKg * 2.20462 * 10) / 10
      : currentWeightKg;
  }, [currentWeightKg, unitSystem]);

  const displayTargetWeight = useMemo(() => {
    return unitSystem === 'imperial'
      ? Math.round(targetWeightKg * 2.20462 * 10) / 10
      : targetWeightKg;
  }, [targetWeightKg, unitSystem]);

  const displayHeight = useMemo(() => {
    return unitSystem === 'imperial'
      ? Math.round((heightCm / 2.54) * 10) / 10
      : heightCm;
  }, [heightCm, unitSystem]);

  // Live Deterministic Calculations
  const calculations = useMemo(() => {
    return calculateMetabolicTargets({
      weightKg: currentWeightKg,
      heightCm,
      gender,
      birthYear,
      activityLevel,
      primaryGoal,
      targetWeightKg,
      targetDate,
    });
  }, [currentWeightKg, heightCm, gender, birthYear, activityLevel, primaryGoal, targetWeightKg, targetDate]);

  // Validation
  const canProceedStep1 = displayName.trim().length > 0 && heightCm > 80 && currentWeightKg > 25;
  const canProceedStep2 = targetWeightKg > 25 && targetDate.length > 0;
  const canProceedStep3 = trainingFrequency >= 1;

  const handleNext = () => {
    if (step < totalSteps) {
      setStep((prev) => prev + 1);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep((prev) => prev - 1);
    }
  };

  const handleFinish = () => {
    if (!user) return;

    const profile: UserProfile = {
      userId: user.id,
      displayName: displayName.trim() || user.displayName,
      preferredLanguage: language,
      unitSystem,
      currentWeightKg,
      heightCm,
      targetWeightKg,
      targetDate,
      primaryGoal,
      activityLevel,
      trainingFrequency,
      birthYear,
      gender,
      notificationPreference,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
      dailyCalorieTarget: calculations.dailyCaloricTarget,
      dailyProteinTargetGrams: calculations.dailyProteinGrams,
      dailyCarbsTargetGrams: calculations.dailyCarbsGrams,
      dailyFatTargetGrams: calculations.dailyFatGrams,
      dailyStepTarget: calculations.dailyStepTarget,
      dailyWaterTargetMl: calculations.dailyWaterMl,
    };

    completeOnboarding(profile);
    setActiveTab('home');
    setActiveView('dashboard');
  };

  return (
    <div id="onboarding-wizard" className="max-w-xl mx-auto py-4 sm:py-8 space-y-6">
      {/* Progress Header */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs font-semibold text-neutral-400">
          <span>{t('onboarding.stepOf', { current: step, total: totalSteps })}</span>
          <span className="text-[#FF6B2B]">
            {step === 1 && t('onboarding.step1Title')}
            {step === 2 && t('onboarding.step2Title')}
            {step === 3 && t('onboarding.step3Title')}
            {step === 4 && t('onboarding.step4Title')}
          </span>
        </div>
        <ProgressBar value={step} max={totalSteps} color="emerald" height="sm" />
      </div>

      {/* STEP 1: Personal Profile & Biometrics */}
      {step === 1 && (
        <GlassCard variant="card" className="p-6 sm:p-8 space-y-6">
          <div className="space-y-1">
            <h2 className="text-2xl font-black text-white tracking-tight">
              {t('onboarding.step1Title')}
            </h2>
            <p className="text-xs sm:text-sm text-neutral-400">
              {t('onboarding.step1Desc')}
            </p>
          </div>

          <div className="space-y-4">
            <Input
              id="input-onboarding-name"
              label={t('onboarding.displayName')}
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              leftIcon={<User className="w-4 h-4" />}
              required
            />

            {/* Language & Unit System Selectors */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5 text-left rtl:text-right">
                <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-400">
                  {t('onboarding.languagePref')}
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setLanguage('en')}
                    className={`py-2.5 px-3 rounded-xl text-xs font-bold border transition-all ${
                      language === 'en'
                        ? 'border-[#FF4E00] bg-[#FF4E00]/15 text-[#FF8D24]'
                        : 'border-white/10 bg-neutral-900/60 text-neutral-400 hover:text-white'
                    }`}
                  >
                    English (EN)
                  </button>
                  <button
                    type="button"
                    onClick={() => setLanguage('ar')}
                    className={`py-2.5 px-3 rounded-xl text-xs font-bold border transition-all ${
                      language === 'ar'
                        ? 'border-[#FF4E00] bg-[#FF4E00]/15 text-[#FF8D24]'
                        : 'border-white/10 bg-neutral-900/60 text-neutral-400 hover:text-white'
                    }`}
                  >
                    العربية (AR)
                  </button>
                </div>
              </div>

              <div className="space-y-1.5 text-left rtl:text-right">
                <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-400">
                  {t('onboarding.unitSystem')}
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setUnitSystem('metric')}
                    className={`py-2.5 px-3 rounded-xl text-xs font-bold border transition-all ${
                      unitSystem === 'metric'
                        ? 'border-[#FF4E00] bg-[#FF4E00]/15 text-[#FF8D24]'
                        : 'border-white/10 bg-neutral-900/60 text-neutral-400 hover:text-white'
                    }`}
                  >
                    {t('onboarding.metric')}
                  </button>
                  <button
                    type="button"
                    onClick={() => setUnitSystem('imperial')}
                    className={`py-2.5 px-3 rounded-xl text-xs font-bold border transition-all ${
                      unitSystem === 'imperial'
                        ? 'border-[#FF4E00] bg-[#FF4E00]/15 text-[#FF8D24]'
                        : 'border-white/10 bg-neutral-900/60 text-neutral-400 hover:text-white'
                    }`}
                  >
                    {t('onboarding.imperial')}
                  </button>
                </div>
              </div>
            </div>

            {/* Biological Gender Selection */}
            <div className="space-y-1.5 text-left rtl:text-right">
              <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-400">
                {t('onboarding.gender')}
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(['male', 'female', 'other'] as const).map((g) => (
                  <button
                    key={g}
                    type="button"
                    onClick={() => setGender(g)}
                    className={`py-2.5 px-3 rounded-xl text-xs font-bold border transition-all ${
                      gender === g
                        ? 'border-[#FF4E00] bg-[#FF4E00]/15 text-[#FF8D24]'
                        : 'border-white/10 bg-neutral-900/60 text-neutral-400 hover:text-white'
                    }`}
                  >
                    {t(`onboarding.${g}`)}
                  </button>
                ))}
              </div>
            </div>

            {/* Weight, Height, Birth Year */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Input
                id="input-onboarding-weight"
                type="number"
                label={`${t('onboarding.currentWeight')} (${unitSystem === 'metric' ? 'kg' : 'lbs'})`}
                value={displayCurrentWeight}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  if (unitSystem === 'imperial') {
                    setCurrentWeightKg(Math.round((val / 2.20462) * 10) / 10);
                  } else {
                    setCurrentWeightKg(val);
                  }
                }}
                leftIcon={<Scale className="w-4 h-4" />}
                min={unitSystem === 'imperial' ? 60 : 30}
                max={unitSystem === 'imperial' ? 660 : 300}
                required
              />

              <Input
                id="input-onboarding-height"
                type="number"
                label={`${t('onboarding.height')} (${unitSystem === 'metric' ? 'cm' : 'in'})`}
                value={displayHeight}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  if (unitSystem === 'imperial') {
                    setHeightCm(Math.round(val * 2.54));
                  } else {
                    setHeightCm(val);
                  }
                }}
                leftIcon={<Ruler className="w-4 h-4" />}
                min={unitSystem === 'imperial' ? 40 : 100}
                max={unitSystem === 'imperial' ? 98 : 250}
                required
              />

              <Input
                id="input-onboarding-birthyear"
                type="number"
                label="Birth Year"
                value={birthYear}
                onChange={(e) => setBirthYear(Number(e.target.value))}
                leftIcon={<Calendar className="w-4 h-4" />}
                min={1940}
                max={2015}
                required
              />
            </div>
          </div>

          <div className="pt-2">
            <Button
              id="btn-onboarding-step1-next"
              size="lg"
              variant="primary"
              disabled={!canProceedStep1}
              onClick={handleNext}
              className="w-full"
              rightIcon={<ArrowRight className="w-4 h-4 rtl:rotate-180" />}
            >
              {t('common.next')}
            </Button>
          </div>
        </GlassCard>
      )}

      {/* STEP 2: Primary Objective */}
      {step === 2 && (
        <GlassCard variant="card" className="p-6 sm:p-8 space-y-6">
          <div className="space-y-1">
            <h2 className="text-2xl font-black text-white tracking-tight">
              {t('onboarding.step2Title')}
            </h2>
            <p className="text-xs sm:text-sm text-neutral-400">
              {t('onboarding.step2Desc')}
            </p>
          </div>

          {/* Goal Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {(
              [
                { id: 'fat_loss', icon: <TrendingDown className="w-5 h-5 text-[#FF6B2B]" /> },
                { id: 'muscle_gain', icon: <TrendingUp className="w-5 h-5 text-[#FF8D24]" /> },
                { id: 'fitness_improvement', icon: <Zap className="w-5 h-5 text-amber-400" /> },
                { id: 'general_wellness', icon: <HeartPulse className="w-5 h-5 text-white" /> },
              ] as const
            ).map((g) => {
              const isSelected = primaryGoal === g.id;
              return (
                <div
                  key={g.id}
                  id={`goal-option-${g.id}`}
                  onClick={() => {
                    setPrimaryGoal(g.id);
                    // Adjust default target weight logically
                    if (g.id === 'fat_loss' && targetWeightKg >= currentWeightKg) {
                      setTargetWeightKg(Math.round((currentWeightKg - 5) * 10) / 10);
                    } else if (g.id === 'muscle_gain' && targetWeightKg <= currentWeightKg) {
                      setTargetWeightKg(Math.round((currentWeightKg + 3) * 10) / 10);
                    }
                  }}
                  className={`p-4 rounded-xl border cursor-pointer transition-all flex flex-col justify-between ${
                    isSelected
                      ? 'border-[#FF4E00] bg-[#FF4E00]/10 shadow-[0_0_16px_rgba(255,78,0,0.15)]'
                      : 'border-white/10 bg-neutral-900/60 hover:border-neutral-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="p-2 rounded-lg bg-neutral-800">{g.icon}</div>
                    {isSelected && (
                      <CheckCircle2 className="w-5 h-5 text-[#FF6B2B]" />
                    )}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-neutral-100">
                      {t(`onboarding.goals.${g.id}.title`)}
                    </h4>
                    <p className="text-xs text-neutral-400 mt-1 leading-snug">
                      {t(`onboarding.goals.${g.id}.desc`)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Target Weight & Target Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <Input
              id="input-onboarding-target-weight"
              type="number"
              label={`${t('onboarding.targetWeight')} (${unitSystem === 'metric' ? 'kg' : 'lbs'})`}
              value={displayTargetWeight}
              onChange={(e) => {
                const val = Number(e.target.value);
                if (unitSystem === 'imperial') {
                  setTargetWeightKg(Math.round((val / 2.20462) * 10) / 10);
                } else {
                  setTargetWeightKg(val);
                }
              }}
              leftIcon={<Scale className="w-4 h-4" />}
              min={unitSystem === 'imperial' ? 60 : 30}
              max={unitSystem === 'imperial' ? 660 : 300}
              required
            />

            <Input
              id="input-onboarding-target-date"
              type="date"
              label={t('onboarding.targetDate')}
              value={targetDate}
              onChange={(e) => setTargetDate(e.target.value)}
              leftIcon={<Calendar className="w-4 h-4" />}
              required
            />
          </div>

          <div className="flex items-center gap-3 pt-2">
            <Button
              size="lg"
              variant="secondary"
              onClick={handleBack}
              leftIcon={<ArrowLeft className="w-4 h-4 rtl:rotate-180" />}
            >
              {t('common.back')}
            </Button>
            <Button
              id="btn-onboarding-step2-next"
              size="lg"
              variant="primary"
              disabled={!canProceedStep2}
              onClick={handleNext}
              className="flex-1"
              rightIcon={<ArrowRight className="w-4 h-4 rtl:rotate-180" />}
            >
              {t('common.next')}
            </Button>
          </div>
        </GlassCard>
      )}

      {/* STEP 3: Activity Level & Training Routine */}
      {step === 3 && (
        <GlassCard variant="card" className="p-6 sm:p-8 space-y-6">
          <div className="space-y-1">
            <h2 className="text-2xl font-black text-white tracking-tight">
              {t('onboarding.step3Title')}
            </h2>
            <p className="text-xs sm:text-sm text-neutral-400">
              {t('onboarding.step3Desc')}
            </p>
          </div>

          {/* Activity Levels */}
          <div className="space-y-2.5">
            {(['sedentary', 'lightly_active', 'moderately_active', 'very_active', 'extra_active'] as const).map(
              (level) => {
                const isSelected = activityLevel === level;
                return (
                  <div
                    key={level}
                    id={`activity-level-${level}`}
                    onClick={() => setActivityLevel(level)}
                    className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                      isSelected
                        ? 'border-[#FF4E00] bg-[#FF4E00]/10 shadow-[0_0_14px_rgba(255,78,0,0.12)]'
                        : 'border-white/10 bg-neutral-900/60 hover:border-neutral-700'
                    }`}
                  >
                    <div>
                      <h4 className="text-sm font-bold text-neutral-100">
                        {t(`onboarding.activityLevels.${level}.title`)}
                      </h4>
                      <p className="text-xs text-neutral-400 mt-0.5">
                        {t(`onboarding.activityLevels.${level}.desc`)}
                      </p>
                    </div>
                    {isSelected && (
                      <CheckCircle2 className="w-5 h-5 text-[#FF6B2B] shrink-0 ml-3 rtl:ml-0 rtl:mr-3" />
                    )}
                  </div>
                );
              }
            )}
          </div>

          {/* Training Days Frequency */}
          <div className="space-y-2 text-left rtl:text-right">
            <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-400">
              {t('onboarding.trainingDaysPerWeek')}
            </label>
            <div className="grid grid-cols-6 gap-1.5">
              {([2, 3, 4, 5, 6, 7] as const).map((days) => (
                <button
                  key={days}
                  type="button"
                  onClick={() => setTrainingFrequency(days as TrainingFrequency)}
                  className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                    trainingFrequency === days
                      ? 'border-[#FF4E00] bg-[#FF4E00] text-white shadow-md shadow-[#FF4E00]/25'
                      : 'border-white/10 bg-neutral-900/60 text-neutral-300 hover:text-white'
                  }`}
                >
                  {days}d
                </button>
              ))}
            </div>
          </div>

          {/* Notifications Opt-in */}
          <div
            onClick={() => setNotificationPreference(!notificationPreference)}
            className="p-3.5 rounded-xl border border-white/10 bg-neutral-900/40 flex items-center justify-between cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-neutral-800 text-[#FF6B2B]">
                <Bell className="w-4 h-4" />
              </div>
              <p className="text-xs font-semibold text-neutral-200">
                {t('onboarding.notificationsPrompt')}
              </p>
            </div>
            <input
              type="checkbox"
              checked={notificationPreference}
              onChange={() => {}}
              className="w-4 h-4 accent-[#FF4E00] rounded cursor-pointer"
            />
          </div>

          <div className="flex items-center gap-3 pt-2">
            <Button
              size="lg"
              variant="secondary"
              onClick={handleBack}
              leftIcon={<ArrowLeft className="w-4 h-4 rtl:rotate-180" />}
            >
              {t('common.back')}
            </Button>
            <Button
              id="btn-onboarding-step3-next"
              size="lg"
              variant="primary"
              disabled={!canProceedStep3}
              onClick={handleNext}
              className="flex-1"
              rightIcon={<ArrowRight className="w-4 h-4 rtl:rotate-180" />}
            >
              {t('common.next')}
            </Button>
          </div>
        </GlassCard>
      )}

      {/* STEP 4: Review Calculations & Metabolic Targets */}
      {step === 4 && (
        <GlassCard variant="glow" className="p-6 sm:p-8 space-y-6 border border-[#FF4E00]/30 bg-gradient-to-br from-neutral-950 via-neutral-900/90 to-[#FF4E00]/10">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-[#FF6B2B]" />
              <h2 className="text-2xl font-black text-white tracking-tight">
                {t('onboarding.step4Title')}
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-neutral-400">
              {t('onboarding.tdeeExplainer')}
            </p>
          </div>

          {/* Safety Warnings if rate is extreme */}
          {!calculations.isSafe && calculations.warningMessageKey && (
            <div className="p-3.5 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <p className="text-xs text-amber-200 font-medium leading-relaxed">
                {t(`onboarding.${calculations.warningMessageKey}`)}
              </p>
            </div>
          )}

          {/* Hero Metabolic Metric */}
          <div className="p-5 rounded-2xl bg-gradient-to-br from-neutral-900/90 to-[#FF4E00]/15 border border-[#FF4E00]/30 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-neutral-400">
                {t('onboarding.dailyCalories')}
              </span>
              <Badge variant="emerald">
                {primaryGoal === 'fat_loss'
                  ? `${calculations.deficitOrSurplus} kcal deficit`
                  : primaryGoal === 'muscle_gain'
                  ? `+${calculations.deficitOrSurplus} kcal surplus`
                  : 'Maintenance'}
              </Badge>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl sm:text-5xl font-black text-[#FF6B2B] tracking-tight">
                {formatNumber(calculations.dailyCaloricTarget, language)}
              </span>
              <span className="text-sm font-semibold text-neutral-400">
                {t('common.kcal')} / day
              </span>
            </div>
            <div className="flex items-center justify-between text-xs text-neutral-400 pt-1 border-t border-white/10">
              <span>{t('onboarding.bmr')}: {formatCalories(calculations.bmr, language)}</span>
              <span>{t('onboarding.tdee')}: {formatCalories(calculations.tdee, language)}</span>
            </div>
          </div>

          {/* Macronutrients Grid */}
          <div className="grid grid-cols-3 gap-3">
            <div className="p-3.5 rounded-xl bg-neutral-900/80 border border-white/5 text-center space-y-1">
              <span className="text-[11px] font-semibold uppercase text-neutral-400">
                {t('onboarding.proteinTarget')}
              </span>
              <p className="text-lg sm:text-xl font-bold text-[#FF8D24]">
                {formatGrams(calculations.dailyProteinGrams, language)}
              </p>
              <span className="text-[10px] text-neutral-500 block">
                {(calculations.dailyProteinGrams * 4)} kcal
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-neutral-900/80 border border-white/5 text-center space-y-1">
              <span className="text-[11px] font-semibold uppercase text-neutral-400">
                {t('onboarding.carbsTarget')}
              </span>
              <p className="text-lg sm:text-xl font-bold text-neutral-200">
                {formatGrams(calculations.dailyCarbsGrams, language)}
              </p>
              <span className="text-[10px] text-neutral-500 block">
                {(calculations.dailyCarbsGrams * 4)} kcal
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-neutral-900/80 border border-white/5 text-center space-y-1">
              <span className="text-[11px] font-semibold uppercase text-neutral-400">
                {t('onboarding.fatTarget')}
              </span>
              <p className="text-lg sm:text-xl font-bold text-amber-400">
                {formatGrams(calculations.dailyFatGrams, language)}
              </p>
              <span className="text-[10px] text-neutral-500 block">
                {(calculations.dailyFatGrams * 9)} kcal
              </span>
            </div>
          </div>

          {/* Daily Steps & Hydration */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-xl bg-neutral-900/60 border border-white/5 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-neutral-800 text-[#FF6B2B]">
                <Activity className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[10px] uppercase font-semibold text-neutral-400">
                  {t('onboarding.stepGoal')}
                </span>
                <p className="text-sm font-bold text-neutral-100">
                  {formatNumber(calculations.dailyStepTarget, language)} {t('common.steps')}
                </p>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-neutral-900/60 border border-white/5 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-neutral-800 text-white">
                <HeartPulse className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[10px] uppercase font-semibold text-neutral-400">
                  Water Target
                </span>
                <p className="text-sm font-bold text-neutral-100">
                  {formatNumber(calculations.dailyWaterMl / 1000, language, { maximumFractionDigits: 1 })} L / day
                </p>
              </div>
            </div>
          </div>

          <p className="text-[11px] text-neutral-400 text-center leading-relaxed">
            {t('onboarding.safetyNotice')}
          </p>

          <div className="flex items-center gap-3 pt-2">
            <Button
              size="lg"
              variant="secondary"
              onClick={handleBack}
              leftIcon={<ArrowLeft className="w-4 h-4 rtl:rotate-180" />}
            >
              {t('common.back')}
            </Button>
            <Button
              id="btn-onboarding-finish"
              size="lg"
              variant="glow"
              onClick={handleFinish}
              className="flex-1"
              rightIcon={<Zap className="w-4 h-4 fill-current" />}
            >
              {t('onboarding.finishOnboarding')}
            </Button>
          </div>
        </GlassCard>
      )}
    </div>
  );
};
