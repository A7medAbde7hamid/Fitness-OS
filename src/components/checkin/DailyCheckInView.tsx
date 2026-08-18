import React, { useState, useEffect } from 'react';
import { useI18n } from '../../context/I18nContext';
import { useAuth } from '../../context/AuthContext';
import { DailyCheckInService } from '../../services/dailyCheckIn';
import { FeelingLevel, EnergyLevel, HungerLevel, SleepQuality } from '../../types';

interface DailyCheckInViewProps {
  onComplete?: () => void;
  onCancel?: () => void;
}

const feelingOptions: FeelingLevel[] = ['great', 'good', 'okay', 'tired', 'bad'];
const energyOptions: EnergyLevel[] = ['high', 'medium', 'low'];
const hungerOptions: HungerLevel[] = ['not_hungry', 'normal', 'hungry', 'very_hungry'];
const sleepOptions: SleepQuality[] = ['excellent', 'good', 'fair', 'poor'];

export const DailyCheckInView: React.FC<DailyCheckInViewProps> = ({ onComplete, onCancel }) => {
  const { t, language } = useI18n();
  const { user } = useAuth();
  const [feeling, setFeeling] = useState<FeelingLevel>('good');
  const [energy, setEnergy] = useState<EnergyLevel>('medium');
  const [hunger, setHunger] = useState<HungerLevel>('normal');
  const [sleep, setSleep] = useState<SleepQuality>('good');
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [alreadyCheckedIn, setAlreadyCheckedIn] = useState(false);

  useEffect(() => {
    if (!user) return;
    const today = new Date().toISOString().split('T')[0];
    DailyCheckInService.getCheckIn(user.id, today).then((existing) => {
      if (existing) {
        setFeeling(existing.feeling);
        setEnergy(existing.energy);
        setHunger(existing.hunger);
        setSleep(existing.sleep);
        setNote(existing.note || '');
        setAlreadyCheckedIn(true);
      }
    });
  }, [user]);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      await DailyCheckInService.saveCheckIn(user.id, today, feeling, energy, hunger, sleep, note || undefined);
      onComplete?.();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-md mx-auto p-4 space-y-6">
      <div className="text-center">
        <h2 className="text-lg font-bold text-white">
          {alreadyCheckedIn ? t('checkin.editTitle') : t('checkin.title')}
        </h2>
        <p className="text-sm text-gray-400 mt-1">{t('checkin.subtitle')}</p>
      </div>

      <div className="space-y-4">
        <fieldset>
          <legend className="text-sm font-medium text-gray-300 mb-2">{t('checkin.feeling')}</legend>
          <div className="flex flex-wrap gap-2" role="radiogroup" aria-label={t('checkin.feeling')}>
            {feelingOptions.map((opt) => (
              <button
                key={opt}
                role="radio"
                aria-checked={feeling === opt}
                onClick={() => setFeeling(opt)}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                  feeling === opt
                    ? 'bg-[#FF4E00] text-white'
                    : 'bg-white/5 text-gray-400 hover:bg-white/10'
                }`}
              >
                {DailyCheckInService.getFeelingLabel(opt, language)}
              </button>
            ))}
          </div>
        </fieldset>

        <fieldset>
          <legend className="text-sm font-medium text-gray-300 mb-2">{t('checkin.energy')}</legend>
          <div className="flex flex-wrap gap-2" role="radiogroup" aria-label={t('checkin.energy')}>
            {energyOptions.map((opt) => (
              <button
                key={opt}
                role="radio"
                aria-checked={energy === opt}
                onClick={() => setEnergy(opt)}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                  energy === opt
                    ? 'bg-[#FF4E00] text-white'
                    : 'bg-white/5 text-gray-400 hover:bg-white/10'
                }`}
              >
                {DailyCheckInService.getEnergyLabel(opt, language)}
              </button>
            ))}
          </div>
        </fieldset>

        <fieldset>
          <legend className="text-sm font-medium text-gray-300 mb-2">{t('checkin.hunger')}</legend>
          <div className="flex flex-wrap gap-2" role="radiogroup" aria-label={t('checkin.hunger')}>
            {hungerOptions.map((opt) => (
              <button
                key={opt}
                role="radio"
                aria-checked={hunger === opt}
                onClick={() => setHunger(opt)}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                  hunger === opt
                    ? 'bg-[#FF4E00] text-white'
                    : 'bg-white/5 text-gray-400 hover:bg-white/10'
                }`}
              >
                {DailyCheckInService.getHungerLabel(opt, language)}
              </button>
            ))}
          </div>
        </fieldset>

        <fieldset>
          <legend className="text-sm font-medium text-gray-300 mb-2">{t('checkin.sleep')}</legend>
          <div className="flex flex-wrap gap-2" role="radiogroup" aria-label={t('checkin.sleep')}>
            {sleepOptions.map((opt) => (
              <button
                key={opt}
                role="radio"
                aria-checked={sleep === opt}
                onClick={() => setSleep(opt)}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                  sleep === opt
                    ? 'bg-[#FF4E00] text-white'
                    : 'bg-white/5 text-gray-400 hover:bg-white/10'
                }`}
              >
                {DailyCheckInService.getSleepLabel(opt, language)}
              </button>
            ))}
          </div>
        </fieldset>

        <div>
          <label htmlFor="checkin-note" className="block text-sm font-medium text-gray-300 mb-1">
            {t('checkin.noteOptional')}
          </label>
          <textarea
            id="checkin-note"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder={t('checkin.notePlaceholder')}
            rows={2}
            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#FF4E00]/50 resize-none"
          />
        </div>
      </div>

      <div className="flex gap-3">
        <button
          onClick={onCancel}
          className="flex-1 px-4 py-3 rounded-xl bg-white/5 text-gray-400 text-sm font-medium hover:bg-white/10 transition-colors"
        >
          {t('common.cancel')}
        </button>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex-1 px-4 py-3 rounded-xl bg-[#FF4E00] text-white text-sm font-semibold hover:bg-[#FF6B20] transition-colors disabled:opacity-50"
        >
          {saving ? t('common.submitting') : t('checkin.save')}
        </button>
      </div>
    </div>
  );
};
