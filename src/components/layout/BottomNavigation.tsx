import React from 'react';
import { Bot, Dumbbell, Home, LineChart, PlusCircle, User } from 'lucide-react';
import { useI18n } from '../../context/I18nContext';
import { useNavigation } from '../../context/NavigationContext';
import { NavTab } from '../../types';

export const BottomNavigation: React.FC = () => {
  const { activeTab, setActiveTab, openQuickAction } = useNavigation();
  const { t } = useI18n();

  const navItems: { tab: NavTab; label: string; icon: React.ReactNode }[] = [
    {
      tab: 'home',
      label: t('nav.home'),
      icon: <Home className="w-5 h-5" />,
    },
    {
      tab: 'coach',
      label: t('nav.coach'),
      icon: <Bot className="w-5 h-5" />,
    },
    {
      tab: 'log',
      label: t('nav.log'),
      icon: <PlusCircle className="w-6 h-6 text-[#FF6B2B]" />,
    },
    {
      tab: 'progress',
      label: t('nav.progress'),
      icon: <LineChart className="w-5 h-5" />,
    },
    {
      tab: 'profile',
      label: t('nav.profile'),
      icon: <User className="w-5 h-5" />,
    },
  ];

  return (
    <nav
      id="bottom-navigation"
      role="navigation"
      aria-label={t('nav.main') || 'Main navigation'}
      className="fixed bottom-0 left-0 right-0 z-40 border-t border-white/10 bg-[#050505]/90 backdrop-blur-2xl px-2 py-1.5"
      style={{ paddingBottom: 'max(0.375rem, env(safe-area-inset-bottom))' }}
    >
      <div className="max-w-md mx-auto flex items-center justify-around">
        {navItems.map((item) => {
          const isActive = activeTab === item.tab;
          const isLogButton = item.tab === 'log';

          if (isLogButton) {
            return (
              <button
                key={item.tab}
                id={`nav-tab-${item.tab}`}
                onClick={() => {
                  setActiveTab('log');
                  openQuickAction('meal');
                }}
                aria-label={item.label}
                className="flex flex-col items-center justify-center p-1 group active:scale-95 transition-transform"
              >
                <div className="w-11 h-11 -mt-4 rounded-full bg-gradient-to-tr from-[#FF4E00] to-[#FF7A00] flex items-center justify-center shadow-lg shadow-[#FF4E00]/35 text-white">
                  <PlusCircle className="w-6 h-6 stroke-[2.5]" />
                </div>
                <span className="text-[10px] font-bold text-[#FF6B2B] mt-0.5">
                  {item.label}
                </span>
              </button>
            );
          }

          return (
            <button
              key={item.tab}
              id={`nav-tab-${item.tab}`}
              onClick={() => setActiveTab(item.tab)}
              aria-label={item.label}
              aria-current={isActive ? 'page' : undefined}
              className={`flex flex-col items-center justify-center py-1.5 px-3 rounded-xl transition-all duration-150 relative ${
                isActive
                  ? 'text-[#FF4E00] font-bold scale-105'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              <div className="relative">
                {item.icon}
                {isActive && (
                  <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-[#FF4E00] shadow-[0_0_8px_#FF4E00]" />
                )}
              </div>
              <span className="text-[11px] mt-1 tracking-tight">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
