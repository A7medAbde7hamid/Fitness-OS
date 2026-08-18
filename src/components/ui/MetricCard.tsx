import React from 'react';
import { GlassCard } from './GlassCard';

interface MetricCardProps {
  label: string;
  value: string | number;
  subValue?: string;
  target?: string | number;
  icon?: React.ReactNode;
  variant?: 'default' | 'glow' | 'accent';
  trend?: 'up' | 'down' | 'neutral';
  trendText?: string;
  progressPercentage?: number;
  className?: string;
  id?: string;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  label,
  value,
  subValue,
  target,
  icon,
  variant = 'default',
  trendText,
  progressPercentage,
  className = '',
  id,
}) => {
  return (
    <GlassCard variant={variant} id={id} className={`flex flex-col justify-between ${className}`}>
      <div className="flex items-center justify-between text-neutral-400 mb-2">
        <span className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
          {label}
        </span>
        {icon && <div className="p-1.5 rounded-lg bg-neutral-900 text-[#FF6B2B] border border-white/5">{icon}</div>}
      </div>

      <div className="space-y-1">
        <div className="flex items-baseline gap-2">
          <span className="text-2xl sm:text-3xl font-extrabold text-[#F5F5F5] tracking-tight">
            {value}
          </span>
          {subValue && <span className="text-xs font-medium text-neutral-400">{subValue}</span>}
        </div>

        {target !== undefined && (
          <div className="text-xs text-neutral-400 flex items-center justify-between">
            <span>Target: {target}</span>
            {trendText && <span className="text-[#FF6B2B] font-semibold">{trendText}</span>}
          </div>
        )}
      </div>

      {progressPercentage !== undefined && (
        <div className="mt-3 w-full bg-neutral-900 rounded-full h-1.5 overflow-hidden border border-white/5">
          <div
            className="h-full bg-gradient-to-r from-[#FF4E00] to-[#FF7A00] rounded-full"
            style={{ width: `${Math.min(100, Math.max(0, progressPercentage))}%` }}
          />
        </div>
      )}
    </GlassCard>
  );
};
