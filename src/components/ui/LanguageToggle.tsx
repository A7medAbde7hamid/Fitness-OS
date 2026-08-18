import React from 'react';
import { Languages } from 'lucide-react';
import { useI18n } from '../../context/I18nContext';

interface LanguageToggleProps {
  id?: string;
  className?: string;
  variant?: 'pill' | 'compact';
}

export const LanguageToggle: React.FC<LanguageToggleProps> = ({
  id = 'btn-lang-toggle',
  className = '',
  variant = 'pill',
}) => {
  const { language, setLanguage } = useI18n();

  if (variant === 'compact') {
    return (
      <button
        id={id}
        onClick={() => setLanguage(language === 'en' ? 'ar' : 'en')}
        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold glass-panel-subtle text-neutral-300 hover:text-white hover:border-neutral-700 transition-colors ${className}`}
        title={language === 'en' ? 'Switch to Arabic' : 'التبديل إلى الإنجليزية'}
      >
        <Languages className="w-3.5 h-3.5 text-[#FF6B2B]" />
        <span>{language === 'en' ? 'العربية' : 'English'}</span>
      </button>
    );
  }

  return (
    <div
      id={id}
      className={`inline-flex items-center p-1 rounded-xl glass-panel border border-white/10 ${className}`}
    >
      <button
        type="button"
        onClick={() => setLanguage('en')}
        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
          language === 'en'
            ? 'bg-[#FF4E00] text-white shadow-md shadow-[#FF4E00]/25'
            : 'text-neutral-400 hover:text-white'
        }`}
      >
        EN
      </button>
      <button
        type="button"
        onClick={() => setLanguage('ar')}
        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
          language === 'ar'
            ? 'bg-[#FF4E00] text-white shadow-md shadow-[#FF4E00]/25'
            : 'text-neutral-400 hover:text-white'
        }`}
      >
        العربية
      </button>
    </div>
  );
};
