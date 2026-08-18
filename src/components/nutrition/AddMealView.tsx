import React, { useState, useCallback } from 'react';
import {
  Camera,
  CheckCircle2,
  Sparkles,
  Upload,
  X,
  AlertTriangle,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useI18n } from '../../context/I18nContext';
import { useHapticFeedback } from '../../hooks/useHapticFeedback';
import { MealType } from '../../types';
import { ImageProcessingService, ProcessedImage } from '../../services/imageProcessingService';
import {
  FoodAnalysisService,
  FoodAnalysisResult,
  CONFIDENCE_LEVELS,
} from '../../services/foodAnalysisService';
import { MealConfirmationService, PendingMeal } from '../../services/mealConfirmationService';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { GlassCard } from '../ui/GlassCard';

interface AddMealViewProps {
  onMealConfirmed?: () => void;
  onCancel?: () => void;
}

export const AddMealView: React.FC<AddMealViewProps> = ({
  onMealConfirmed,
  onCancel,
}) => {
  const { user } = useAuth();
  const { language } = useI18n();
  const { trigger } = useHapticFeedback();
  const isAr = language === 'ar';

  const [mealType, setMealType] = useState<MealType>('lunch');
  const [description, setDescription] = useState('');
  const [selectedImage, setSelectedImage] = useState<ProcessedImage | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<FoodAnalysisResult | null>(null);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [pendingMeal, setPendingMeal] = useState<PendingMeal | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handlePickImage = useCallback(async () => {
    const image = await ImageProcessingService.pickFromGallery();
    if (image) {
      setSelectedImage(image);
      setImagePreviewUrl(image.dataUrl);
      trigger('light');
    }
  }, [trigger]);

  const handleCaptureImage = useCallback(async () => {
    const image = await ImageProcessingService.captureFromCamera();
    if (image) {
      setSelectedImage(image);
      setImagePreviewUrl(image.dataUrl);
      trigger('light');
    }
  }, [trigger]);

  const handleRemoveImage = useCallback(() => {
    setSelectedImage(null);
    setImagePreviewUrl(null);
    trigger('light');
  }, [trigger]);

  const handleAnalyze = useCallback(async () => {
    if (!description.trim() && !selectedImage) return;
    if (!user) return;

    setIsAnalyzing(true);
    setAnalysisError(null);
    setAnalysisResult(null);
    setPendingMeal(null);
    trigger('medium');

    try {
      let result: FoodAnalysisResult;

      if (selectedImage && description.trim()) {
        result = await FoodAnalysisService.analyzeCombined(selectedImage, description.trim(), language);
      } else if (selectedImage) {
        result = await FoodAnalysisService.analyzeFromImage(selectedImage, language);
      } else {
        result = await FoodAnalysisService.analyzeFromDescription(description.trim(), language);
      }

      setAnalysisResult(result);

      const pending = MealConfirmationService.createPendingMeal(
        user.id,
        mealType,
        result,
        description.trim() || undefined
      );
      setPendingMeal(pending);
      trigger('success');
    } catch (err: any) {
      console.error('Analysis failed:', err);
      setAnalysisError(err?.message || (isAr ? 'فشل تحليل الوجبة' : 'Failed to analyze meal'));
      trigger('error');
    } finally {
      setIsAnalyzing(false);
    }
  }, [description, selectedImage, user, mealType, language, isAr, trigger]);

  const handleConfirm = useCallback(async () => {
    if (!pendingMeal || !user) return;
    setIsSaving(true);
    trigger('mealLogged');

    try {
      const result = MealConfirmationService.confirmMeal(user.id, pendingMeal.id);
      if (result.success) {
        setSaved(true);
        setPendingMeal(null);
        setAnalysisResult(null);
        setDescription('');
        setSelectedImage(null);
        setImagePreviewUrl(null);
        onMealConfirmed?.();
        trigger('success');
      }
    } catch (err) {
      console.error('Failed to confirm meal:', err);
    } finally {
      setIsSaving(false);
    }
  }, [pendingMeal, user, trigger, onMealConfirmed]);

  const handleDiscard = useCallback(() => {
    if (pendingMeal && user) {
      MealConfirmationService.discardMeal(user.id, pendingMeal.id);
    }
    setPendingMeal(null);
    setAnalysisResult(null);
    trigger('light');
  }, [pendingMeal, user, trigger]);

  const confidenceInfo = analysisResult ? CONFIDENCE_LEVELS[analysisResult.confidenceLevel] : null;

  if (saved) {
    return (
      <GlassCard variant="card" className="p-6 text-center space-y-4">
        <div className="w-16 h-16 mx-auto rounded-full bg-emerald-500/20 flex items-center justify-center">
          <CheckCircle2 className="w-8 h-8 text-emerald-400" />
        </div>
        <h3 className="text-lg font-bold text-white">
          {isAr ? 'تم تسجيل الوجبة بنجاح!' : 'Meal Logged Successfully!'}
        </h3>
        <p className="text-sm text-neutral-400">
          {isAr ? 'تم حفظ الوجبة في سجلك اليومي.' : 'Your meal has been saved to your daily log.'}
        </p>
        <Button
          variant="primary"
          size="md"
          onClick={() => { setSaved(false); onMealConfirmed?.(); }}
          className="w-full"
        >
          {isAr ? 'إضافة وجبة أخرى' : 'Log Another Meal'}
        </Button>
      </GlassCard>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-bold text-white flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-[#FF6B2B]" />
          <span>{isAr ? 'تحليل الوجبة الذكي' : 'Smart Meal Analysis'}</span>
        </h3>
        {onCancel && (
          <button
            onClick={onCancel}
            className="p-2 rounded-lg text-neutral-400 hover:text-white transition-colors"
            aria-label={isAr ? 'إلغاء' : 'Cancel'}
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

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
          {isAr ? 'صورة الوجبة (اختياري)' : 'Meal Photo (Optional)'}
        </label>
        {imagePreviewUrl ? (
          <div className="relative rounded-xl overflow-hidden border border-white/10">
            <img src={imagePreviewUrl} alt={isAr ? 'صورة الوجبة' : 'Meal preview'} className="w-full h-48 object-cover" />
            <button
              onClick={handleRemoveImage}
              className="absolute top-2 right-2 p-1.5 rounded-full bg-black/60 text-white hover:bg-black/80 transition-colors"
              aria-label={isAr ? 'إزالة الصورة' : 'Remove image'}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={handleCaptureImage}
              className="flex flex-col items-center gap-2 p-4 rounded-xl border border-dashed border-white/20 bg-neutral-900/40 hover:bg-neutral-900/60 transition-colors"
            >
              <Camera className="w-6 h-6 text-[#FF6B2B]" />
              <span className="text-xs font-medium text-neutral-300">{isAr ? 'التقاط صورة' : 'Take Photo'}</span>
            </button>
            <button
              onClick={handlePickImage}
              className="flex flex-col items-center gap-2 p-4 rounded-xl border border-dashed border-white/20 bg-neutral-900/40 hover:bg-neutral-900/60 transition-colors"
            >
              <Upload className="w-6 h-6 text-[#FF6B2B]" />
              <span className="text-xs font-medium text-neutral-300">{isAr ? 'اختيار من المعرض' : 'Upload Image'}</span>
            </button>
          </div>
        )}
      </div>

      <div className="space-y-2">
        <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-400">
          {isAr ? 'وصف الوجبة' : 'Meal Description'}
        </label>
        <textarea
          id="textarea-meal-description"
          rows={3}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder={isAr
            ? 'اكتب تفاصيل الوجبة، مثلاً: "200 جم صدر دجاج مع طبق أرز وسلطة"'
            : 'Describe your meal, e.g. "Grilled chicken breast 200g with brown rice and broccoli"'}
          className="w-full rounded-xl p-3.5 text-sm glass-input placeholder:text-neutral-500 resize-none"
        />
      </div>

      <Button
        id="btn-analyze-meal"
        variant="primary"
        size="md"
        disabled={(!description.trim() && !selectedImage) || isAnalyzing}
        isLoading={isAnalyzing}
        onClick={handleAnalyze}
        rightIcon={<Sparkles className="w-4 h-4" />}
        className="w-full"
      >
        {isAnalyzing
          ? (isAr ? 'جاري التحليل...' : 'Analyzing...')
          : (isAr ? 'تحليل بالذكاء الاصطناعي' : 'Analyze with AI')}
      </Button>

      {analysisError && (
        <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-semibold flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          <span>{analysisError}</span>
        </div>
      )}

      {pendingMeal && analysisResult && (
        <GlassCard variant="card" className="p-4 sm:p-5 space-y-4 border border-[#FF4E00]/30 animate-in fade-in duration-300">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#FF6B2B] uppercase tracking-wider">
              {isAr ? 'نتيجة التحليل' : 'Analysis Result'}
            </span>
            {confidenceInfo && (
              <Badge variant={analysisResult.confidenceLevel === 'high' ? 'emerald' : analysisResult.confidenceLevel === 'medium' ? 'amber' : 'rose'}>
                {isAr ? confidenceInfo.labelAr : confidenceInfo.label}
              </Badge>
            )}
          </div>

          {confidenceInfo && (
            <p className={`text-xs ${confidenceInfo.color}`}>
              {isAr ? confidenceInfo.descriptionAr : confidenceInfo.description}
            </p>
          )}

          <div className="grid grid-cols-4 gap-2 text-center">
            <div className="p-2.5 rounded-lg bg-neutral-950 border border-white/5">
              <span className="text-[10px] text-neutral-400 block">{isAr ? 'سعرات' : 'Calories'}</span>
              <span className="text-sm font-bold text-white">{pendingMeal.totalCalories}</span>
            </div>
            <div className="p-2.5 rounded-lg bg-neutral-950 border border-white/5">
              <span className="text-[10px] text-neutral-400 block">{isAr ? 'بروتين' : 'Protein'}</span>
              <span className="text-sm font-bold text-[#FF8D24]">{pendingMeal.totalProtein}g</span>
            </div>
            <div className="p-2.5 rounded-lg bg-neutral-950 border border-white/5">
              <span className="text-[10px] text-neutral-400 block">{isAr ? 'نشويات' : 'Carbs'}</span>
              <span className="text-sm font-bold text-neutral-200">{pendingMeal.totalCarbs}g</span>
            </div>
            <div className="p-2.5 rounded-lg bg-neutral-950 border border-white/5">
              <span className="text-[10px] text-neutral-400 block">{isAr ? 'دهون' : 'Fat'}</span>
              <span className="text-sm font-bold text-amber-400">{pendingMeal.totalFat}g</span>
            </div>
          </div>

          <div className="space-y-2">
            {pendingMeal.items.map((item, idx) => (
              <div key={idx} className="p-3 rounded-lg bg-neutral-900/60 border border-white/5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white">{item.name}</span>
                  <span className="text-[10px] text-neutral-400">{item.portion}</span>
                </div>
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-[10px] text-neutral-500">{item.calories} kcal</span>
                  <span className="text-[10px] text-[#FF8D24]">P: {item.protein}g</span>
                  <span className="text-[10px] text-neutral-400">C: {item.carbs}g</span>
                  <span className="text-[10px] text-amber-400">F: {item.fat}g</span>
                </div>
              </div>
            ))}
          </div>

          <div className="flex gap-2">
            <Button
              id="btn-discard-meal"
              variant="secondary"
              size="md"
              onClick={handleDiscard}
              className="flex-1"
            >
              {isAr ? 'تجاهل' : 'Discard'}
            </Button>
            <Button
              id="btn-confirm-meal"
              variant="glow"
              size="md"
              onClick={handleConfirm}
              isLoading={isSaving}
              leftIcon={<CheckCircle2 className="w-4 h-4" />}
              className="flex-[2]"
            >
              {isAr ? 'تأكيد وحفظ' : 'Confirm & Save'}
            </Button>
          </div>
        </GlassCard>
      )}
    </div>
  );
};
