import React, { useState } from 'react';
import { ArrowLeft, ArrowRight, Lock, Mail, Play, ShieldAlert, User as UserIcon } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useI18n } from '../../context/I18nContext';
import { useNavigation } from '../../context/NavigationContext';
import { Button } from '../ui/Button';
import { GlassCard } from '../ui/GlassCard';
import { Input } from '../ui/Input';

export const AuthView: React.FC = () => {
  const { login, signup, loginDemo, isLoading, error: authError } = useAuth();
  const { t, language } = useI18n();
  const { setActiveView } = useNavigation();

  const [mode, setMode] = useState<'login' | 'register'>('register');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    if (!email || !email.includes('@')) {
      setValidationError(t('auth.errorInvalidEmail'));
      return;
    }

    if (!password || password.length < 6) {
      setValidationError(t('auth.errorShortPassword'));
      return;
    }

    if (mode === 'register' && !name.trim()) {
      setValidationError(t('auth.errorRequiredName'));
      return;
    }

    if (mode === 'register') {
      try {
        await signup(name, email, password);
        setActiveView('onboarding');
      } catch {
        // Handled by context
      }
    } else {
      const ok = await login(email, password);
      if (ok) {
        setActiveView('onboarding');
      }
    }
  };

  const handleDemoAccess = () => {
    loginDemo(language);
    setActiveView('dashboard');
  };

  return (
    <div id="auth-view" className="max-w-md mx-auto py-6 sm:py-12 space-y-6">
      <button
        id="btn-auth-back-landing"
        onClick={() => setActiveView('landing')}
        className="flex items-center gap-2 text-xs font-semibold text-neutral-400 hover:text-white transition-colors"
      >
        <ArrowLeft className="w-4 h-4 rtl:rotate-180" />
        <span>{t('common.back')}</span>
      </button>

      <GlassCard variant="card" className="p-6 sm:p-8 space-y-6">
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-black tracking-tight text-white">
            {mode === 'login' ? t('auth.welcomeBack') : t('auth.createAccount')}
          </h2>
          <p className="text-xs sm:text-sm text-neutral-400">
            {mode === 'login' ? t('auth.loginSubtitle') : t('auth.registerSubtitle')}
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="grid grid-cols-2 p-1 rounded-xl bg-neutral-900/90 border border-white/10">
          <button
            id="tab-auth-register"
            type="button"
            onClick={() => {
              setMode('register');
              setValidationError(null);
            }}
            className={`py-2 text-xs font-bold rounded-lg transition-all ${
              mode === 'register'
                ? 'bg-[#FF4E00] text-white shadow-md shadow-[#FF4E00]/25'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            {t('auth.signUpButton')}
          </button>
          <button
            id="tab-auth-login"
            type="button"
            onClick={() => {
              setMode('login');
              setValidationError(null);
            }}
            className={`py-2 text-xs font-bold rounded-lg transition-all ${
              mode === 'login'
                ? 'bg-[#FF4E00] text-white shadow-md shadow-[#FF4E00]/25'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            {t('auth.signInButton')}
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'register' && (
            <Input
              id="input-auth-name"
              label={t('auth.nameLabel')}
              placeholder={t('auth.namePlaceholder')}
              value={name}
              onChange={(e) => setName(e.target.value)}
              leftIcon={<UserIcon className="w-4 h-4" />}
              required
            />
          )}

          <Input
            id="input-auth-email"
            type="email"
            label={t('auth.emailLabel')}
            placeholder={t('auth.emailPlaceholder')}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            leftIcon={<Mail className="w-4 h-4" />}
            required
          />

          <Input
            id="input-auth-password"
            type="password"
            label={t('auth.passwordLabel')}
            placeholder={t('auth.passwordPlaceholder')}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            leftIcon={<Lock className="w-4 h-4" />}
            required
          />

          {(validationError || authError) && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-medium">
              {validationError || authError}
            </div>
          )}

          <Button
            id="btn-auth-submit"
            type="submit"
            size="lg"
            variant="primary"
            isLoading={isLoading}
            className="w-full mt-2"
            rightIcon={<ArrowRight className="w-4 h-4 rtl:rotate-180" />}
          >
            {mode === 'login' ? t('auth.signInButton') : t('auth.signUpButton')}
          </Button>
        </form>

        {/* Divider */}
        <div className="relative flex items-center justify-center my-4">
          <div className="w-full border-t border-white/10" />
          <span className="absolute px-3 bg-[#0a0a0a] text-[11px] font-semibold text-neutral-500 uppercase tracking-wider">
            {t('auth.orDivider')}
          </span>
        </div>

        {/* Instant Demo Sandbox Access */}
        <Button
          id="btn-auth-quick-demo"
          type="button"
          variant="secondary"
          size="md"
          onClick={handleDemoAccess}
          leftIcon={<Play className="w-4 h-4 text-[#FF6B2B] fill-[#FF6B2B]/20" />}
          className="w-full border-white/10 hover:border-[#FF4E00]/40"
        >
          {t('auth.quickDemo')}
        </Button>

        <p className="text-[11px] text-neutral-400 text-center flex items-center justify-center gap-1.5 pt-1">
          <ShieldAlert className="w-3.5 h-3.5 text-neutral-400" />
          <span>{t('auth.demoNotice')}</span>
        </p>
      </GlassCard>
    </div>
  );
};
