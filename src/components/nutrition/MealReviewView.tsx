import React, { useState, useCallback } from 'react';
import { CheckCircle2, Edit3, Trash2, Plus, AlertTriangle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useI18n } from '../../context/I18nContext';
import { useHapticFeedback } from '../../hooks/useHapticFeedback';
import { FoodItem } from '../../types';
import { MealConfirmationService, PendingMeal } from '../../services/mealConfirmationService';
import { CONFIDENCE_LEVELS } from '../../services/foodAnalysisService';
import { Button } from '../ui/Button';
import { GlassCard } from '../ui/GlassCard';

interface MealReviewViewProps {
  pendingMeal: PendingMeal;
  onUpdate?: (updated: PendingMeal) => void;
  onDiscarded?: () => void;
  onConfirmed?: () => void;
}

export const MealReviewView: React.FC<MealReviewViewProps> = ({
  pendingMeal,
  onUpdate,
  onDiscarded,
  onConfirmed,
}) => {
  const { user } = useAuth();
  const { language } = useI18n();
  const { trigger } = useHapticFeedback();
  const isAr = language === 'ar';

  const [editingItem, setEditingItem] = useState<number | null>(null);
  const [editValues, setEditValues] = useState<Partial<FoodItem>>({});
  const [isSaving, setIsSaving] = useState(false);

  const confidenceInfo = CONFIDENCE_LEVELS[pendingMeal.confidenceLevel];

  const handleEditItem = useCallback((index: number) => {
    setEditingItem(index);
    setEditValues({ ...pendingMeal.items[index] });
  }, [pendingMeal.items]);

  const handleSaveItemEdit = useCallback(() => {
    if (editingItem === null || !user) return;
    const updated = MealConfirmationService.updateItemInPending(
      user.id,
      pendingMeal.id,
      editingItem,
      editValues
    );
    if (updated && onUpdate) onUpdate(updated);
    setEditingItem(null);
    setEditValues({});
    trigger('light');
  }, [editingItem, editValues, user, pendingMeal.id, onUpdate, trigger]);

  const handleRemoveItem = useCallback((index: number) => {
    if (!user) return;
    const updated = MealConfirmationService.removeItemFromPending(user.id, pendingMeal.id, index);
    if (updated && onUpdate) onUpdate(updated);
    trigger('light');
  }, [user, pendingMeal.id, onUpdate, trigger]);

  const handleAddItem = useCallback(() => {
    if (!user) return;
    const newItem: FoodItem = {
      name: isAr ? 'عنصر جديد' : 'New Item',
      portion: '1 serving',
      grams: 100,
      calories: 100,
      protein: 10,
      carbs: 10,
      fat: 3,
      confidence: 1.0,
    };
    const updated = MealConfirmationService.addItemToPending(user.id, pendingMeal.id, newItem);
    if (updated && onUpdate) {
      onUpdate(updated);
      setEditingItem(updated.items.length - 1);
      setEditValues(newItem);
    }
  }, [user, pendingMeal.id, onUpdate, isAr, trigger]);

  const handleConfirm = useCallback(async () => {
    if (!user) return;
    setIsSaving(true);
    trigger('mealLogged');

    try {
      const result = MealConfirmationService.confirmMeal(user.id, pendingMeal.id);
      if (result.success) {
        onConfirmed?.();
        trigger('success');
      }
    } catch (err) {
      console.error('Failed to confirm meal:', err);
    } finally {
      setIsSaving(false);
    }
  }, [user, pendingMeal.id, onConfirmed, trigger]);

  const handleDiscard = useCallback(() => {
    if (!user) return;
    MealConfirmationService.discardMeal(user.id, pendingMeal.id);
    onDiscarded?.();
    trigger('light');
  }, [user, pendingMeal.id, onDiscarded, trigger]);

  return (
    <GlassCard variant="card" className="p-4 sm:p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-bold text-white">
          {isAr ? 'مراجعة الوجبة' : 'Review Meal'}
        </h4>
        <span className={`text-xs font-semibold ${confidenceInfo.color}`}>
          {isAr ? confidenceInfo.labelAr : confidenceInfo.label}
        </span>
      </div>

      {pendingMeal.confidenceLevel === 'low' && (
        <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 text-rose-400 mt-0.5 flex-shrink-0" />
          <p className="text-xs text-rose-400">
            {isAr
              ? 'لم يتم التعرف على الطعام بوضوح. يرجى مراجعة العناصر يدوياً قبل التأكيد.'
              : 'Food was not identified clearly. Please review items manually before confirming.'}
          </p>
        </div>
      )}

      <div className="space-y-3">
        {pendingMeal.items.map((item, idx) => (
          <div key={idx} className="p-3 rounded-xl bg-neutral-900/60 border border-white/5 space-y-2">
            {editingItem === idx ? (
              <div className="space-y-2">
                <input
                  type="text"
                  value={editValues.name || ''}
                  onChange={(e) => setEditValues({ ...editValues, name: e.target.value })}
                  className="w-full rounded-lg p-2 text-xs glass-input text-white"
                  placeholder={isAr ? 'اسم الطعام' : 'Food name'}
                />
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="number"
                    value={editValues.calories || 0}
                    onChange={(e) => setEditValues({ ...editValues, calories: Number(e.target.value) })}
                    className="rounded-lg p-2 text-xs glass-input text-white"
                    placeholder="kcal"
                  />
                  <input
                    type="number"
                    value={editValues.protein || 0}
                    onChange={(e) => setEditValues({ ...editValues, protein: Number(e.target.value) })}
                    className="rounded-lg p-2 text-xs glass-input text-white"
                    placeholder="Protein g"
                  />
                  <input
                    type="number"
                    value={editValues.carbs || 0}
                    onChange={(e) => setEditValues({ ...editValues, carbs: Number(e.target.value) })}
                    className="rounded-lg p-2 text-xs glass-input text-white"
                    placeholder="Carbs g"
                  />
                  <input
                    type="number"
                    value={editValues.fat || 0}
                    onChange={(e) => setEditValues({ ...editValues, fat: Number(e.target.value) })}
                    className="rounded-lg p-2 text-xs glass-input text-white"
                    placeholder="Fat g"
                  />
                </div>
                <div className="flex gap-2">
                  <Button variant="secondary" size="sm" onClick={() => setEditingItem(null)} className="flex-1">
                    {isAr ? 'إلغاء' : 'Cancel'}
                  </Button>
                  <Button variant="primary" size="sm" onClick={handleSaveItemEdit} className="flex-1">
                    {isAr ? 'حفظ' : 'Save'}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-white">{item.name}</span>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] text-neutral-500">{item.calories} kcal</span>
                    <span className="text-[10px] text-[#FF8D24]">P: {item.protein}g</span>
                    <span className="text-[10px] text-neutral-400">C: {item.carbs}g</span>
                    <span className="text-[10px] text-amber-400">F: {item.fat}g</span>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleEditItem(idx)}
                    className="p-1.5 rounded-lg text-neutral-400 hover:text-white transition-colors"
                    aria-label={isAr ? 'تعديل' : 'Edit'}
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleRemoveItem(idx)}
                    className="p-1.5 rounded-lg text-neutral-400 hover:text-rose-400 transition-colors"
                    aria-label={isAr ? 'حذف' : 'Delete'}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}

        <button
          onClick={handleAddItem}
          className="w-full p-2.5 rounded-xl border border-dashed border-white/15 text-neutral-400 hover:text-white hover:border-white/30 transition-colors flex items-center justify-center gap-2 text-xs font-medium"
        >
          <Plus className="w-3.5 h-3.5" />
          {isAr ? 'إضافة عنصر' : 'Add Item'}
        </button>
      </div>

      <div className="grid grid-cols-4 gap-2 text-center pt-2">
        <div className="p-2 rounded-lg bg-neutral-950 border border-white/5">
          <span className="text-[10px] text-neutral-400 block">{isAr ? 'سعرات' : 'kcal'}</span>
          <span className="text-sm font-bold text-white">{pendingMeal.totalCalories}</span>
        </div>
        <div className="p-2 rounded-lg bg-neutral-950 border border-white/5">
          <span className="text-[10px] text-neutral-400 block">{isAr ? 'بروتين' : 'Protein'}</span>
          <span className="text-sm font-bold text-[#FF8D24]">{pendingMeal.totalProtein}g</span>
        </div>
        <div className="p-2 rounded-lg bg-neutral-950 border border-white/5">
          <span className="text-[10px] text-neutral-400 block">{isAr ? 'نشويات' : 'Carbs'}</span>
          <span className="text-sm font-bold text-neutral-200">{pendingMeal.totalCarbs}g</span>
        </div>
        <div className="p-2 rounded-lg bg-neutral-950 border border-white/5">
          <span className="text-[10px] text-neutral-400 block">{isAr ? 'دهون' : 'Fat'}</span>
          <span className="text-sm font-bold text-amber-400">{pendingMeal.totalFat}g</span>
        </div>
      </div>

      <div className="flex gap-2 pt-1">
        <Button variant="secondary" size="md" onClick={handleDiscard} className="flex-1">
          {isAr ? 'تجاهل' : 'Discard'}
        </Button>
        <Button
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
  );
};
