import { useState, useEffect, useMemo } from 'react';

export type GlassVariant =
  | 'default'
  | 'card'
  | 'subtle'
  | 'elevated'
  | 'glow'
  | 'accent'
  | 'floating'
  | 'sidebar'
  | 'hero'
  | 'modal'
  | 'input';

export type BlurLevel = 'none' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl';
export type GlowColor = 'orange' | 'white' | 'emerald' | 'amber' | 'none';

export interface GlassStyleOptions {
  variant?: GlassVariant;
  interactive?: boolean;
  blur?: BlurLevel;
  glowColor?: GlowColor;
  respondToScroll?: boolean;
  scrollThreshold?: number;
  className?: string;
}

export interface GlassStyleResult {
  className: string;
  isScrolled: boolean;
  scrollY: number;
}

/**
 * Static dictionary of Sophisticated Dark glass styles
 */
export const glassStyles: Record<GlassVariant, string> = {
  default: 'bg-white/[0.04] backdrop-blur-xl border border-white/10 shadow-lg shadow-black/30',
  card: 'bg-[#0a0a0a]/80 backdrop-blur-2xl border border-white/[0.08] shadow-xl shadow-black/40',
  subtle: 'bg-white/[0.02] backdrop-blur-md border border-white/[0.05]',
  elevated: 'bg-[#121212]/90 backdrop-blur-2xl border border-white/[0.12] shadow-2xl shadow-black/60',
  glow: 'bg-[#0e0e0e]/85 backdrop-blur-2xl border border-[#FF4E00]/30 shadow-[0_0_25px_rgba(255,78,0,0.15)]',
  accent: 'bg-[#FF4E00]/[0.08] backdrop-blur-xl border border-[#FF4E00]/25 shadow-[0_0_20px_rgba(255,78,0,0.1)]',
  floating: 'bg-[#050505]/90 backdrop-blur-3xl border border-white/[0.12] shadow-2xl shadow-black/80',
  sidebar: 'bg-[#080808]/95 backdrop-blur-2xl border-r border-white/[0.08]',
  hero: 'bg-gradient-to-br from-[#0f0f0f]/95 via-[#0a0a0a]/90 to-[#FF4E00]/[0.08] backdrop-blur-3xl border border-white/[0.1] shadow-2xl shadow-black/50',
  modal: 'bg-[#0c0c0c]/95 backdrop-blur-3xl border border-white/[0.12] shadow-2xl shadow-black/90',
  input: 'bg-neutral-900/60 backdrop-blur-md border border-white/10 focus:border-[#FF4E00]/50 focus:bg-neutral-900/90 transition-all',
};

/**
 * Pure CSS Utility to generate glass-morphism classnames without hooks
 */
export function getGlassClassName(options: GlassStyleOptions = {}): string {
  const {
    variant = 'card',
    interactive = false,
    blur,
    glowColor = 'none',
    className = '',
  } = options;

  let baseClass = glassStyles[variant] || glassStyles.card;

  // Custom blur override
  if (blur && blur !== 'none') {
    baseClass = baseClass.replace(/backdrop-blur-\w+/, `backdrop-blur-${blur}`);
  }

  // Interactive hover classes
  const hoverClass = interactive
    ? 'hover:border-white/20 hover:bg-white/[0.06] transition-all duration-200 cursor-pointer active:scale-[0.99]'
    : '';

  // Optional glow styling
  let glowClass = '';
  if (glowColor === 'orange' && variant !== 'glow') {
    glowClass = 'shadow-[0_0_22px_rgba(255,78,0,0.14)] border-[#FF4E00]/30';
  } else if (glowColor === 'white') {
    glowClass = 'shadow-[0_0_20px_rgba(255,255,255,0.08)] border-white/25';
  } else if (glowColor === 'emerald') {
    glowClass = 'shadow-[0_0_20px_rgba(16,185,129,0.15)] border-emerald-500/30';
  } else if (glowColor === 'amber') {
    glowClass = 'shadow-[0_0_20px_rgba(245,158,11,0.15)] border-amber-500/30';
  }

  return [baseClass, hoverClass, glowClass, className].filter(Boolean).join(' ');
}

/**
 * useGlassStyle Hook
 * Standardizes the application's glass-panel appearance across all components
 * Supports dynamic opacity & backdrop blur adjustments based on window or container scroll states
 */
export function useGlassStyle(options: GlassStyleOptions = {}): GlassStyleResult {
  const {
    variant = 'card',
    interactive = false,
    blur = '2xl',
    glowColor = 'none',
    respondToScroll = false,
    scrollThreshold = 40,
    className: extraClass = '',
  } = options;

  const [scrollY, setScrollY] = useState<number>(0);
  const isScrolled = scrollY > scrollThreshold;

  useEffect(() => {
    if (!respondToScroll) return;

    const handleScroll = () => {
      setScrollY(window.scrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [respondToScroll]);

  const className = useMemo(() => {
    let bgClass = '';
    let borderClass = 'border border-white/[0.08]';
    let shadowClass = '';

    switch (variant) {
      case 'subtle':
        bgClass = isScrolled && respondToScroll ? 'bg-[#0a0a0a]/85' : 'bg-white/[0.02]';
        borderClass = 'border border-white/[0.05]';
        break;
      case 'elevated':
        bgClass = isScrolled && respondToScroll ? 'bg-[#121212]/98' : 'bg-[#121212]/90';
        borderClass = 'border border-white/[0.12]';
        shadowClass = 'shadow-2xl shadow-black/60';
        break;
      case 'glow':
        bgClass = 'bg-[#0e0e0e]/85';
        borderClass = 'border border-[#FF4E00]/30';
        shadowClass = 'shadow-[0_0_25px_rgba(255,78,0,0.15)]';
        break;
      case 'accent':
        bgClass = 'bg-[#FF4E00]/[0.08]';
        borderClass = 'border border-[#FF4E00]/25';
        shadowClass = 'shadow-[0_0_20px_rgba(255,78,0,0.1)]';
        break;
      case 'floating':
        bgClass = isScrolled && respondToScroll ? 'bg-[#050505]/98' : 'bg-[#050505]/90';
        borderClass = 'border border-white/[0.12]';
        shadowClass = 'shadow-2xl shadow-black/80';
        break;
      case 'sidebar':
        bgClass = 'bg-[#080808]/95';
        borderClass = 'border-r border-white/[0.08]';
        break;
      case 'hero':
        bgClass = 'bg-gradient-to-br from-[#0f0f0f]/95 via-[#0a0a0a]/90 to-[#FF4E00]/[0.08]';
        borderClass = 'border border-white/[0.1]';
        shadowClass = 'shadow-2xl shadow-black/50';
        break;
      case 'modal':
        bgClass = 'bg-[#0c0c0c]/95';
        borderClass = 'border border-white/[0.12]';
        shadowClass = 'shadow-2xl shadow-black/90';
        break;
      case 'input':
        bgClass = 'bg-neutral-900/60';
        borderClass = 'border border-white/10';
        break;
      case 'default':
        bgClass = isScrolled && respondToScroll ? 'bg-[#0a0a0a]/90' : 'bg-white/[0.04]';
        borderClass = 'border border-white/10';
        shadowClass = 'shadow-lg shadow-black/30';
        break;
      case 'card':
      default:
        bgClass = isScrolled && respondToScroll ? 'bg-[#0e0e0e]/95' : 'bg-[#0a0a0a]/80';
        borderClass = 'border border-white/[0.08]';
        shadowClass = 'shadow-xl shadow-black/40';
        break;
    }

    const blurClass = `backdrop-blur-${blur}`;

    const hoverClass = interactive
      ? 'hover:border-white/20 hover:bg-white/[0.06] transition-all duration-200 cursor-pointer active:scale-[0.99]'
      : '';

    if (glowColor === 'orange' && variant !== 'glow') {
      shadowClass = `${shadowClass} shadow-[0_0_22px_rgba(255,78,0,0.14)]`;
      borderClass = 'border border-[#FF4E00]/30';
    } else if (glowColor === 'white') {
      shadowClass = `${shadowClass} shadow-[0_0_20px_rgba(255,255,255,0.08)]`;
      borderClass = 'border border-white/25';
    } else if (glowColor === 'emerald') {
      shadowClass = `${shadowClass} shadow-[0_0_20px_rgba(16,185,129,0.15)]`;
      borderClass = 'border border-emerald-500/30';
    }

    return [
      bgClass,
      blurClass,
      borderClass,
      shadowClass,
      hoverClass,
      extraClass,
    ]
      .filter(Boolean)
      .join(' ');
  }, [variant, interactive, blur, glowColor, respondToScroll, isScrolled, extraClass]);

  return {
    className,
    isScrolled,
    scrollY,
  };
}
