import React, { useState, useEffect } from 'react';
import { Activity, CheckCircle2, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useI18n } from '../../context/I18nContext';
import { useHapticFeedback } from '../../hooks/useHapticFeedback';
import { ActivityService, ActivityType, ActivityIntensity } from '../../services/activity';
import { Button } from '../ui/Button';
import { GlassCard } from '../ui/GlassCard';
import { Input } from '../ui/Input';

interface ActivityLogModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ACTIVITY_TYPES: { value: ActivityType; labelEn: string; labelAr: string }[] = [
  { value: 'walking', labelEn: 'Walking', labelAr: 'مشي' },
  { value: 'running', labelEn: 'Running', labelAr: 'جري' },
  { value: 'cycling', labelEn: 'Cycling', labelAr: 'دراجة' },
  { value: 'swimming', labelEn: 'Swimming', labelAr: 'سباحة' },
  { value: 'hiit', labelEn: 'HIIT', labelAr: 'HIIT' },
  { value: 'steps', labelEn: 'Steps Only', labelAr: 'خطوات فقط' },
  { value: 'other', labelEn: 'Other', labelAr: 'أخرى' },
];

const INTENSITY_OPTIONS: { value: ActivityIntensity; labelEn: string; labelAr: string }[] = [
  { value: 'low', labelEn: 'Low', labelAr: 'خفيف' },
  { value: 'moderate', labelEn: 'Moderate', labelAr: 'متوسط' },
  { value: 'high', labelEn: 'High', labelAr: 'عالي' },
  { value: 'very_high', labelEn: 'Very High', labelAr: 'عالي جداً' },
];

export const ActivityLogModal: React.FC<ActivityLogModalProps> = ({ isOpen, onClose }) => {
  const { user, profile } = useAuth();
  const { language } = useI18n();
  const { trigger } = useHapticFeedback();
  const isAr = language === 'ar';

  const [activityType, setActivityType] = useState<ActivityType>('walking');
  const [duration, setDuration] = useState<number>(30);
  const [distance, setDistance] = useState<number>(0);
  const [steps, setSteps] = useState<number>(0);
  const [intensity, setIntensity] = useState<ActivityIntensity>('moderate');
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    trigger('success');

    await ActivityService.logActivity({
      userId: user.id,
      activityType,
      durationMinutes: duration,
      distanceKm: distance > 0 ? distance : undefined,
      steps: steps > 0 ? steps : undefined,
      intensity,
      source: 'manual',
    });

    setSaved(true);
    setSaving(false);
    setTimeout(() => {
      setSaved(false);
      onClose();
    }, 1500);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      role="dialog"
      aria-modal="true"
      aria-label={isAr ? 'تسجيل النشاط' : 'Log Activity'}
    >
      <GlassCard variant="card" className="w-full max-w-md p-6 space-y-5 animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-black text-white flex items-center gap-2">
            <Activity className="w-5 h-5 text-amber-400" />
            {isAr ? 'تسجيل النشاط' : 'Log Activity'}
          </h2>
          <button
            id="btn-close-activity-modal"
            onClick={onClose}
            aria-label={isAr ? 'إغلاق' : 'Close'}
            className="p-2 rounded-lg hover:bg-neutral-800 transition-colors"
          >
            <X className="w-4 h-4 text-neutral-400" />
          </button>
        </div>

        {saved ? (
          <div className="py-8 text-center space-y-3">
            <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto" />
            <p className="text-sm font-bold text-white">
              {isAr ? 'تم تسجيل النشاط بنجاح' : 'Activity logged successfully!'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-2">
                {isAr ? 'نوع النشاط' : 'Activity Type'}
              </label>
              <div className="grid grid-cols-4 gap-1.5" role="radiogroup" aria-label={isAr ? 'نوع النشاط' : 'Activity Type'}>
                {ACTIVITY_TYPES.map((type) => (
                  <button
                    key={type.value}
                    id={`activity-type-${type.value}`}
                    onClick={() => setActivityType(type.value)}
                    role="radio"
                    aria-checked={activityType === type.value}
                    className={`py-2 px-2 rounded-xl text-[10px] font-bold border transition-all ${
                      activityType === type.value
                        ? 'border-amber-500 bg-amber-500/15 text-amber-300'
                        : 'border-white/10 bg-neutral-900/60 text-neutral-400'
                    }`}
                  >
                    {isAr ? type.labelAr : type.labelEn}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-2">
                {isAr ? 'الشدة' : 'Intensity'}
              </label>
              <div className="grid grid-cols-4 gap-1.5" role="radiogroup" aria-label={isAr ? 'الشدة' : 'Intensity'}>
                {INTENSITY_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    id={`intensity-${opt.value}`}
                    onClick={() => setIntensity(opt.value)}
                    role="radio"
                    aria-checked={intensity === opt.value}
                    className={`py-2 px-2 rounded-xl text-[10px] font-bold border transition-all ${
                      intensity === opt.value
                        ? 'border-amber-500 bg-amber-500/15 text-amber-300'
                        : 'border-white/10 bg-neutral-900/60 text-neutral-400'
                    }`}
                  >
                    {isAr ? opt.labelAr : opt.labelEn}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Input
                id="input-activity-duration"
                type="number"
                label={isAr ? 'المدة (دقيقة)' : 'Duration (min)'}
                value={duration}
                onChange={(e) => setDuration(Number(e.target.value))}
                min={1}
              />
              <Input
                id="input-activity-distance"
                type="number"
                label={isAr ? 'المسافة (كم)' : 'Distance (km)'}
                value={distance}
                onChange={(e) => setDistance(Number(e.target.value))}
                step={0.1}
                min={0}
              />
            </div>

            {(activityType === 'walking' || activityType === 'running' || activityType === 'steps') && (
              <Input
                id="input-activity-steps"
                type="number"
                label={isAr ? 'الخطوات' : 'Steps'}
                value={steps}
                onChange={(e) => setSteps(Number(e.target.value))}
                min={0}
              />
            )}

            <div className="p-3 rounded-xl bg-neutral-900/80 border border-white/5 text-center">
              <span className="text-[10px] text-neutral-400 block">
                {isAr ? 'السعرات التقريبية' : 'Estimated Calories'}
              </span>
              <span className="text-lg font-black text-white">
                {ActivityService.estimateCalories(activityType, duration, intensity, profile?.currentWeightKg || 74)} {isAr ? 'كالوري' : 'kcal'}
              </span>
            </div>

            <Button
              id="btn-save-activity-modal"
              variant="primary"
              size="lg"
              onClick={handleSave}
              isLoading={saving}
              className="w-full"
            >
              {isAr ? 'حفظ النشاط' : 'Save Activity'}
            </Button>
          </div>
        )}
      </GlassCard>
    </div>
  );
};
