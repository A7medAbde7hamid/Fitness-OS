import React from 'react';
import { useGlassStyle, GlassVariant } from '../../hooks/useGlassStyle';

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  variant?: GlassVariant;
  interactive?: boolean;
  className?: string;
  id?: string;
}

export const GlassCard: React.FC<GlassCardProps> = ({
  children,
  variant = 'card',
  interactive = false,
  className = '',
  id,
  ...props
}) => {
  const { className: glassClass } = useGlassStyle({ variant, interactive });

  return (
    <div
      id={id}
      className={`rounded-2xl p-4 sm:p-6 transition-all duration-200 ${glassClass} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

