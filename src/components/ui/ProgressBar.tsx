import React from 'react';

interface ProgressBarProps {
  value: number; // current value
  max: number;   // maximum/target value
  color?: 'emerald' | 'cyan' | 'amber' | 'rose' | 'purple';
  height?: 'sm' | 'md' | 'lg';
  showPercentage?: boolean;
  className?: string;
  id?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  value,
  max,
  color = 'emerald',
  height = 'md',
  showPercentage = false,
  className = '',
  id,
}) => {
  const percentage = max > 0 ? Math.min(100, Math.max(0, Math.round((value / max) * 100))) : 0;

  const heightClasses = {
    sm: 'h-1.5',
    md: 'h-2.5',
    lg: 'h-3.5',
  };

  const colorGradients = {
    emerald: 'from-[#FF4E00] to-[#FF7A00] shadow-[0_0_12px_rgba(255,78,0,0.35)]',
    cyan: 'from-slate-200 to-white shadow-[0_0_12px_rgba(255,255,255,0.2)]',
    amber: 'from-amber-500 to-orange-400 shadow-[0_0_12px_rgba(245,158,11,0.3)]',
    rose: 'from-rose-500 to-pink-500 shadow-[0_0_12px_rgba(244,63,94,0.3)]',
    purple: 'from-orange-600 to-[#FF4E00] shadow-[0_0_12px_rgba(255,78,0,0.3)]',
  };

  return (
    <div id={id} className={`w-full ${className}`}>
      {showPercentage && (
        <div className="flex justify-between items-center text-xs text-neutral-400 font-semibold mb-1">
          <span>{percentage}%</span>
        </div>
      )}
      <div className={`w-full bg-neutral-900 rounded-full overflow-hidden p-0.5 border border-white/10 ${heightClasses[height]}`}>
        <div
          className={`h-full rounded-full bg-gradient-to-r transition-all duration-500 ease-out ${colorGradients[color]}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};
