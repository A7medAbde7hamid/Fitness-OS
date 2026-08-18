import React, { useState, useEffect, useRef } from 'react';
import { CheckCircle2, Scale, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useI18n } from '../../context/I18nContext';
import { useHapticFeedback } from '../../hooks/useHapticFeedback';
import { MetricsService } from '../../services/metrics';
import { Button } from '../ui/Button';
import { GlassCard } from '../ui/GlassCard';
import { Input } from '../ui/Input';

interface WeightLogModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const WeightLogModal: React.FC<WeightLogModalProps> = ({ isOpen, onClose }) => {
  const { user, profile } = useAuth();
  const { language } = useI18n();
  const { trigger } = useHapticFeedback();
  const isAr = language === 'ar';

  const [weight, setWeight] = useState<number>(profile?.currentWeightKg || 74);
  const [notes, setNotes] = useState('');
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const inputId = 'input-weight-modal';

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
    await MetricsService.logWeight(user.id, weight, notes || undefined);
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
      aria-label={isAr ? 'تسجيل الوزن' : 'Log Weight'}
    >
      <GlassCard variant="card" className="w-full max-w-md p-6 space-y-5 animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-black text-white flex items-center gap-2">
            <Scale className="w-5 h-5 text-[#FF6B2B]" />
            {isAr ? 'تسجيل الوزن' : 'Log Weight'}
          </h2>
          <button
            id="btn-close-weight-modal"
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
              {isAr ? 'تم تسجيل الوزن بنجاح' : 'Weight logged successfully!'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <Input
              id={inputId}
              type="number"
              label={`${isAr ? 'الوزن' : 'Weight'} (${profile?.unitSystem === 'imperial' ? 'lbs' : 'kg'})`}
              value={weight}
              onChange={(e) => setWeight(Number(e.target.value))}
              step={0.1}
              leftIcon={<Scale className="w-4 h-4" />}
            />

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-2" htmlFor="textarea-weight-notes">
                {isAr ? 'ملاحظات (اختياري)' : 'Notes (optional)'}
              </label>
              <textarea
                id="textarea-weight-notes"
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder={isAr ? 'مثال: صباح الريق، بعد التمرين' : 'e.g. Morning fasted, post-workout'}
                className="w-full rounded-xl p-3 text-sm glass-input placeholder:text-neutral-500 resize-none"
              />
            </div>

            <Button
              id="btn-save-weight-modal"
              variant="primary"
              size="lg"
              onClick={handleSave}
              isLoading={saving}
              className="w-full"
            >
              {isAr ? 'حفظ الوزن' : 'Save Weight'}
            </Button>
          </div>
        )}
      </GlassCard>
    </div>
  );
};
