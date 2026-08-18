import React, { useState } from 'react';
import {
  Download,
  Flame,
  Globe2,
  Lock,
  LogOut,
  Moon,
  MessageCircle,
  RefreshCw,
  Scale,
  Shield,
  Trash2,
  User as UserIcon,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useI18n } from '../../context/I18nContext';
import { useNavigation } from '../../context/NavigationContext';
import { AppStorageRepository } from '../../db/storage';
import { formatHeight, formatWeight } from '../../i18n/formatters';
import { UnitSystem } from '../../types';
import { WhatsAppSettings } from './WhatsAppSettings';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { GlassCard } from '../ui/GlassCard';
import { Input } from '../ui/Input';

export const ProfileView: React.FC = () => {
  const { user, profile, updateProfile, logout } = useAuth();
  const { t, language, setLanguage } = useI18n();
  const { setActiveView } = useNavigation();

  const [displayName, setDisplayName] = useState(profile?.displayName || user?.displayName || '');
  const [unitSystem, setUnitSystem] = useState<UnitSystem>(profile?.unitSystem || 'metric');
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSavePreferences = () => {
    if (!profile) return;
    const updated = {
      ...profile,
      displayName,
      unitSystem,
      preferredLanguage: language,
    };
    updateProfile(updated);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  const handleExportData = () => {
    if (!user) return;
    const data = {
      user,
      profile,
      measurements: AppStorageRepository.getMeasurements(user.id),
      meals: AppStorageRepository.getMeals(user.id),
      activities: AppStorageRepository.getActivities(user.id),
      workouts: AppStorageRepository.getWorkouts(user.id),
      exportedAt: new Date().toISOString(),
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ai-fitness-os-export-${user.id}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleSignOut = () => {
    logout();
    setActiveView('landing');
  };

  return (
    <div id="profile-view" className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-black text-white tracking-tight">
          {t('profile.title')}
        </h1>
        <p className="text-xs sm:text-sm text-slate-400">
          {t('profile.subtitle')}
        </p>
      </div>

      {/* User Card */}
      <GlassCard variant="card" className="p-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#FF4E00] to-[#FF7A00] flex items-center justify-center text-white font-black text-xl shadow-lg shadow-[#FF4E00]/25">
            {displayName.charAt(0).toUpperCase() || <UserIcon className="w-7 h-7" />}
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">{displayName}</h2>
            <p className="text-xs text-neutral-400">{user?.email}</p>
            <div className="flex items-center gap-2 mt-1.5">
              <Badge variant="emerald">{profile?.primaryGoal?.replace('_', ' ').toUpperCase()}</Badge>
              <Badge variant="neutral">{profile?.activityLevel}</Badge>
            </div>
          </div>
        </div>
      </GlassCard>

      {/* Preferences Form */}
      <GlassCard variant="card" className="p-6 space-y-5">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider">
          {t('profile.preferences')}
        </h3>

        <Input
          id="input-profile-name"
          label={t('onboarding.displayName')}
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          leftIcon={<UserIcon className="w-4 h-4" />}
        />

        {/* Language Switcher */}
        <div className="space-y-1.5 text-left rtl:text-right">
          <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-400">
            {t('profile.languageDirection')}
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setLanguage('en')}
              className={`py-2.5 px-3 rounded-xl text-xs font-bold border transition-all ${
                language === 'en'
                  ? 'border-[#FF4E00] bg-[#FF4E00]/15 text-[#FF8D24]'
                  : 'border-white/10 bg-neutral-900/60 text-neutral-400'
              }`}
            >
              English (LTR)
            </button>
            <button
              type="button"
              onClick={() => setLanguage('ar')}
              className={`py-2.5 px-3 rounded-xl text-xs font-bold border transition-all ${
                language === 'ar'
                  ? 'border-[#FF4E00] bg-[#FF4E00]/15 text-[#FF8D24]'
                  : 'border-white/10 bg-neutral-900/60 text-neutral-400'
              }`}
            >
              العربية (RTL)
            </button>
          </div>
        </div>

        {/* Units Switcher */}
        <div className="space-y-1.5 text-left rtl:text-right">
          <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-400">
            {t('profile.units')}
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setUnitSystem('metric')}
              className={`py-2.5 px-3 rounded-xl text-xs font-bold border transition-all ${
                unitSystem === 'metric'
                  ? 'border-[#FF4E00] bg-[#FF4E00]/15 text-[#FF8D24]'
                  : 'border-white/10 bg-neutral-900/60 text-neutral-400'
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
                  : 'border-white/10 bg-neutral-900/60 text-neutral-400'
              }`}
            >
              {t('onboarding.imperial')}
            </button>
          </div>
        </div>

        <Button
          id="btn-save-profile"
          variant="primary"
          size="md"
          onClick={handleSavePreferences}
          className="w-full"
        >
          {t('common.save')}
        </Button>

        {savedSuccess && (
          <p className="text-xs text-[#FF6B2B] font-semibold text-center">
            {t('common.success')}
          </p>
        )}
      </GlassCard>

      {/* WhatsApp Integration */}
      <WhatsAppSettings />

      {/* Data Management & Danger Zone */}
      <GlassCard variant="card" className="p-6 space-y-4">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider">
          {t('profile.dangerZone')}
        </h3>

        <div className="space-y-2">
          <Button
            id="btn-export-data"
            variant="secondary"
            size="md"
            onClick={handleExportData}
            leftIcon={<Download className="w-4 h-4 text-white" />}
            className="w-full justify-start"
          >
            {t('profile.exportData')}
          </Button>

          <Button
            id="btn-signout"
            variant="danger"
            size="md"
            onClick={handleSignOut}
            leftIcon={<LogOut className="w-4 h-4" />}
            className="w-full justify-start"
          >
            {t('profile.signOut')}
          </Button>
        </div>
      </GlassCard>
    </div>
  );
};
