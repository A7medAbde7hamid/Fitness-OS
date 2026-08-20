import React, { useState } from 'react';
import { ArrowLeft, ArrowRight, Eye, EyeOff, KeyRound, Lock, Mail, Play, ShieldAlert, User as UserIcon } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useI18n } from '../../context/I18nContext';
import { useNavigation } from '../../context/NavigationContext';
import { Button } from '../ui/Button';
import { GlassCard } from '../ui/GlassCard';
import { Input } from '../ui/Input';

type AuthMode = 'login' | 'register' | 'forgot';

export const AuthView: React.FC = () => {
  const { login, signup, loginDemo, resetPassword, isLoading, error: authError } = useAuth();
  const { t, language } = useI18n();
  const { setActiveView } = useNavigation();

  const [mode, setMode] = useState<AuthMode>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [forgotSent, setForgotSent] = useState(false);
  const [forgotLoading, setForgotLoading] = useState(false);

  const clearErrors = () => {
    setValidationError(null);
    setForgotSent(false);
  };

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
        await signup(name, email, password, language);
        setActiveView('dashboard');
      } catch {
        // Error handled by context
      }
    } else {
      const ok = await login(email, password);
      if (ok) {
        setActiveView('dashboard');
      }
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    if (!email || !email.includes('@')) {
      setValidationError(t('auth.errorInvalidEmail'));
      return;
    }

    setForgotLoading(true);
    try {
      const result = await resetPassword(email);
      if (result.success) {
        setForgotSent(true);
      } else {
        setValidationError(result.message || t('auth.forgotPasswordError'));
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : t('auth.forgotPasswordError');
      setValidationError(msg);
    } finally {
      setForgotLoading(false);
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
            {mode === 'login' ? t('auth.welcomeBack') : mode === 'register' ? t('auth.createAccount') : t('auth.forgotPasswordTitle')}
          </h2>
          <p className="text-xs sm:text-sm text-neutral-400">
            {mode === 'login' ? t('auth.loginSubtitle') : mode === 'register' ? t('auth.registerSubtitle') : t('auth.forgotPasswordSubtitle')}
          </p>
        </div>

        {mode === 'forgot' ? (
          <form onSubmit={handleForgotPassword} className="space-y-4">
            <Input
              id="input-forgot-email"
              type="email"
              label={t('auth.emailLabel')}
              placeholder={t('auth.emailPlaceholder')}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              leftIcon={<Mail className="w-4 h-4" />}
              required
            />

            {(validationError || authError) && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-medium">
                {validationError || authError}
              </div>
            )}

            {forgotSent && (
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-medium">
                {t('auth.forgotPasswordSent')}
              </div>
            )}

            <Button
              id="btn-forgot-submit"
              type="submit"
              size="lg"
              variant="primary"
              isLoading={forgotLoading}
              className="w-full mt-2"
              rightIcon={<KeyRound className="w-4 h-4 rtl:rotate-180" />}
            >
              {t('auth.forgotPasswordSend')}
            </Button>

            <button
              type="button"
              onClick={() => { setMode('login'); clearErrors(); }}
              className="w-full text-center text-xs font-semibold text-neutral-400 hover:text-white transition-colors py-2"
            >
              {t('auth.backToLogin')}
            </button>
          </form>
        ) : (
          <>
            {/* Tab Switcher */}
            <div className="grid grid-cols-2 p-1 rounded-xl bg-neutral-900/90 border border-white/10">
              <button
                id="tab-auth-login"
                type="button"
                onClick={() => { setMode('login'); clearErrors(); }}
                className={`py-2 text-xs font-bold rounded-lg transition-all ${
                  mode === 'login'
                    ? 'bg-[#FF4E00] text-white shadow-md shadow-[#FF4E00]/25'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                {t('auth.signInButton')}
              </button>
              <button
                id="tab-auth-register"
                type="button"
                onClick={() => { setMode('register'); clearErrors(); }}
                className={`py-2 text-xs font-bold rounded-lg transition-all ${
                  mode === 'register'
                    ? 'bg-[#FF4E00] text-white shadow-md shadow-[#FF4E00]/25'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                {t('auth.signUpButton')}
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

              <div className="relative">
                <Input
                  id="input-auth-password"
                  type={showPassword ? 'text' : 'password'}
                  label={t('auth.passwordLabel')}
                  placeholder={t('auth.passwordPlaceholder')}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  leftIcon={<Lock className="w-4 h-4" />}
                  required
                />
                <button
                  type="button"
                  id="btn-toggle-password"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-[38px] rtl:right-auto rtl:left-3 text-slate-400 hover:text-white transition-colors p-1"
                  aria-label={showPassword ? t('auth.hidePassword') : t('auth.showPassword')}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {mode === 'login' && (
                <button
                  type="button"
                  id="btn-forgot-password"
                  onClick={() => { setMode('forgot'); clearErrors(); }}
                  className="text-xs font-semibold text-[#FF6B2B] hover:text-[#FF8D24] transition-colors text-right rtl:text-left"
                >
                  {t('auth.forgotPassword')}
                </button>
              )}

              {(validationError || authError) && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-medium" role="alert">
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
          </>
        )}
      </GlassCard>
    </div>
  );
};
