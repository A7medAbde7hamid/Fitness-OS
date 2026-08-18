import React from 'react';
import { Activity, ShieldAlert, User as UserIcon } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useI18n } from '../../context/I18nContext';
import { useNavigation } from '../../context/NavigationContext';
import { LanguageToggle } from '../ui/LanguageToggle';
import { UnitToggle } from '../ui/UnitToggle';

export const AppHeader: React.FC = () => {
  const { user, isDemoMode, isAuthenticated } = useAuth();
  const { t, language } = useI18n();
  const { setActiveTab, activeTab } = useNavigation();

  return (
    <header
      id="app-header"
      className="sticky top-0 z-40 w-full border-b border-white/10 bg-[#050505]/85 backdrop-blur-xl transition-all"
    >
      <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        <button
          id="btn-header-brand"
          onClick={() => setActiveTab('home')}
          className="flex items-center gap-2.5 cursor-pointer select-none group bg-transparent border-none p-0"
          aria-label={language === 'ar' ? 'الذهاب إلى الرئيسية' : 'Go to home'}
        >
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#FF4E00] to-[#FF7A00] flex items-center justify-center shadow-lg shadow-[#FF4E00]/25 group-hover:scale-105 transition-transform">
            <Activity className="w-5 h-5 text-white stroke-[2.5]" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-extrabold tracking-tight text-white flex items-center gap-1.5">
              <span>{language === 'ar' ? 'نظام اللياقة' : 'AI FITNESS OS'}</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-[#FF4E00]/20 text-[#FF6B2B] font-mono font-bold">
                PRO
              </span>
            </span>
            <span className="text-[10px] text-neutral-400 font-medium hidden sm:inline-block">
              {t('app.tagline')}
            </span>
          </div>
        </button>

        <div className="flex items-center gap-2.5">
          {isDemoMode && (
            <div
              id="demo-mode-badge"
              className="hidden sm:flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20"
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>{t('common.demoMode')}</span>
            </div>
          )}

          <UnitToggle variant="compact" />
          <LanguageToggle variant="compact" />

          {isAuthenticated && (
            <button
              id="btn-header-profile"
              onClick={() => setActiveTab('profile')}
              aria-label={user?.displayName || (language === 'ar' ? 'الملف الشخصي' : 'Profile')}
              className={`flex items-center gap-2 p-1.5 rounded-xl border transition-all ${
                activeTab === 'profile'
                  ? 'border-[#FF4E00]/60 bg-[#FF4E00]/10 text-white'
                  : 'border-white/10 bg-neutral-900/80 text-neutral-300 hover:text-white'
              }`}
            >
              <div className="w-7 h-7 rounded-lg bg-neutral-800 flex items-center justify-center text-xs font-bold text-[#FF6B2B]">
                {user?.displayName?.charAt(0).toUpperCase() || <UserIcon className="w-4 h-4" />}
              </div>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
