import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'emerald' | 'cyan' | 'amber' | 'rose' | 'neutral';
  size?: 'sm' | 'md';
  icon?: React.ReactNode;
  className?: string;
  id?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'emerald',
  size = 'sm',
  icon,
  className = '',
  id,
}) => {
  const variantStyles = {
    emerald: 'bg-[#FF4E00]/10 text-[#FF6B2B] border-[#FF4E00]/25',
    cyan: 'bg-white/10 text-white border-white/20',
    amber: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    rose: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
    neutral: 'bg-neutral-900/80 text-neutral-300 border-white/10',
  };

  const sizeStyles = {
    sm: 'text-[11px] px-2.5 py-0.5 font-semibold',
    md: 'text-xs px-3 py-1 font-bold',
  };

  return (
    <span
      id={id}
      className={`inline-flex items-center gap-1.5 rounded-full border tracking-wide whitespace-nowrap ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
    >
      {icon && <span className="shrink-0">{icon}</span>}
      <span>{children}</span>
    </span>
  );
};
