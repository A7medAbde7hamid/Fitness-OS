import React from 'react';
import { Scale } from 'lucide-react';
import { useI18n } from '../../context/I18nContext';

interface UnitToggleProps {
  id?: string;
  className?: string;
  variant?: 'pill' | 'compact';
}

export const UnitToggle: React.FC<UnitToggleProps> = ({
  id = 'btn-unit-toggle',
  className = '',
  variant = 'compact',
}) => {
  const { unitSystem, toggleUnitSystem, setUnitSystem, language } = useI18n();

  if (variant === 'compact') {
    return (
      <button
        id={id}
        type="button"
        onClick={toggleUnitSystem}
        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold glass-panel-subtle text-neutral-300 hover:text-white hover:border-neutral-700 transition-colors ${className}`}
        title={
          unitSystem === 'metric'
            ? language === 'ar' ? 'التبديل إلى النظام الإمبراطوري (باوند/ميل)' : 'Switch to Imperial (lbs/mi)'
            : language === 'ar' ? 'التبديل إلى النظام المتري (كجم/كم)' : 'Switch to Metric (kg/km)'
        }
      >
        <Scale className="w-3.5 h-3.5 text-[#FF6B2B]" />
        <span className="font-mono uppercase">{unitSystem === 'metric' ? 'Metric' : 'Imperial'}</span>
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
        onClick={() => setUnitSystem('metric')}
        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
          unitSystem === 'metric'
            ? 'bg-[#FF4E00] text-white shadow-md shadow-[#FF4E00]/25'
            : 'text-neutral-400 hover:text-white'
        }`}
      >
        {language === 'ar' ? 'متري (kg)' : 'Metric (kg)'}
      </button>
      <button
        type="button"
        onClick={() => setUnitSystem('imperial')}
        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
          unitSystem === 'imperial'
            ? 'bg-[#FF4E00] text-white shadow-md shadow-[#FF4E00]/25'
            : 'text-neutral-400 hover:text-white'
        }`}
      >
        {language === 'ar' ? 'إمبراطوري (lbs)' : 'Imperial (lbs)'}
      </button>
    </div>
  );
};
