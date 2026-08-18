import React from 'react';
import {
  Activity,
  ArrowRight,
  BrainCircuit,
  CheckCircle2,
  ChevronRight,
  Flame,
  Languages,
  Play,
  ShieldCheck,
  Sparkles,
  Zap,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useI18n } from '../../context/I18nContext';
import { useNavigation } from '../../context/NavigationContext';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { GlassCard } from '../ui/GlassCard';

export const LandingView: React.FC = () => {
  const { t, language } = useI18n();
  const { loginDemo } = useAuth();
  const { setActiveView } = useNavigation();

  const handleStartDemo = () => {
    loginDemo(language);
    setActiveView('dashboard');
  };

  const handleCreateAccount = () => {
    setActiveView('auth');
  };

  return (
    <div id="landing-view" className="space-y-12 py-4 sm:py-8">
      {/* Hero Section */}
      <section className="text-center space-y-6 max-w-3xl mx-auto">
        <div className="flex justify-center">
          <Badge variant="emerald" size="md" icon={<Sparkles className="w-3.5 h-3.5" />}>
            {t('landing.badge')}
          </Badge>
        </div>

        <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-white leading-[1.1]">
          {t('landing.heroTitle1')}{' '}
          <span className="bg-gradient-to-r from-[#FF4E00] via-[#FF7A00] to-[#FFA043] bg-clip-text text-transparent">
            {t('landing.heroTitle2')}
          </span>
        </h1>

        <p className="text-base sm:text-lg text-neutral-400 max-w-2xl mx-auto leading-relaxed">
          {t('landing.heroSubtitle')}
        </p>

        {/* Action CTAs */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 pt-2">
          <Button
            id="btn-landing-get-started"
            size="lg"
            variant="glow"
            onClick={handleCreateAccount}
            rightIcon={<ArrowRight className="w-4 h-4 rtl:rotate-180" />}
            className="w-full sm:w-auto"
          >
            {t('landing.startFree')}
          </Button>

          <Button
            id="btn-landing-demo"
            size="lg"
            variant="secondary"
            onClick={handleStartDemo}
            leftIcon={<Play className="w-4 h-4 text-[#FF6B2B] fill-[#FF6B2B]/20" />}
            className="w-full sm:w-auto"
          >
            {t('landing.exploreDemo')}
          </Button>
        </div>

        {/* High-Tech Trust Badges */}
        <div className="grid grid-cols-3 gap-3 pt-6 max-w-lg mx-auto">
          <div className="glass-panel-subtle rounded-xl p-2.5 text-center">
            <p className="text-xs font-bold text-neutral-200">{t('landing.stats.coaching')}</p>
          </div>
          <div className="glass-panel-subtle rounded-xl p-2.5 text-center">
            <p className="text-xs font-bold text-neutral-200">{t('landing.stats.accuracy')}</p>
          </div>
          <div className="glass-panel-subtle rounded-xl p-2.5 text-center">
            <p className="text-xs font-bold text-neutral-200">{t('landing.stats.bilingual')}</p>
          </div>
        </div>
      </section>

      {/* Feature Cards Grid */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 pt-4">
        <GlassCard variant="glow" className="space-y-3">
          <div className="w-10 h-10 rounded-xl bg-[#FF4E00]/10 border border-[#FF4E00]/25 flex items-center justify-center text-[#FF6B2B]">
            <BrainCircuit className="w-5 h-5" />
          </div>
          <h3 className="text-lg font-bold text-neutral-100">
            {t('landing.features.aiCoachTitle')}
          </h3>
          <p className="text-sm text-neutral-400 leading-relaxed">
            {t('landing.features.aiCoachDesc')}
          </p>
        </GlassCard>

        <GlassCard variant="accent" className="space-y-3">
          <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/15 flex items-center justify-center text-white">
            <Languages className="w-5 h-5" />
          </div>
          <h3 className="text-lg font-bold text-neutral-100">
            {t('landing.features.bilingualTitle')}
          </h3>
          <p className="text-sm text-neutral-400 leading-relaxed">
            {t('landing.features.bilingualDesc')}
          </p>
        </GlassCard>

        <GlassCard variant="card" className="space-y-3">
          <div className="w-10 h-10 rounded-xl bg-[#FF4E00]/10 border border-[#FF4E00]/20 flex items-center justify-center text-[#FF6B2B]">
            <Flame className="w-5 h-5" />
          </div>
          <h3 className="text-lg font-bold text-neutral-100">
            {t('landing.features.precisionTitle')}
          </h3>
          <p className="text-sm text-neutral-400 leading-relaxed">
            {t('landing.features.precisionDesc')}
          </p>
        </GlassCard>

        <GlassCard variant="card" className="space-y-3">
          <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/15 flex items-center justify-center text-neutral-300">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <h3 className="text-lg font-bold text-neutral-100">
            {t('landing.features.privacyTitle')}
          </h3>
          <p className="text-sm text-neutral-400 leading-relaxed">
            {t('landing.features.privacyDesc')}
          </p>
        </GlassCard>
      </section>

      {/* Interactive Quick Start Callout */}
      <GlassCard className="border border-[#FF4E00]/30 bg-gradient-to-br from-neutral-900/90 via-neutral-900/70 to-[#FF4E00]/10 p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="space-y-2 text-center sm:text-left rtl:sm:text-right">
          <h4 className="text-xl font-bold text-white">
            {language === 'ar'
              ? 'جاهز لتجربة مدربك الرياضي الذكي؟'
              : 'Ready to experience your Personal Fitness OS?'}
          </h4>
          <p className="text-sm text-neutral-400 max-w-lg">
            {language === 'ar'
              ? 'انطلق الآن في دقيقة واحدة واكتشف خطتك الأيضية المصممة علمياً.'
              : 'Launch now in one minute and discover your scientifically engineered metabolic targets.'}
          </p>
        </div>
        <Button
          id="btn-landing-launch-now"
          size="lg"
          variant="primary"
          onClick={handleCreateAccount}
          rightIcon={<ChevronRight className="w-4 h-4 rtl:rotate-180" />}
          className="shrink-0 w-full sm:w-auto"
        >
          {t('landing.startFree')}
        </Button>
      </GlassCard>
    </div>
  );
};
