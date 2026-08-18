import React, { useState } from 'react';
import { Mail, Lock, ArrowRight, Play, User } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useI18n } from '../../context/I18nContext';
import { Button } from '../ui/Button';
import { GlassCard } from '../ui/GlassCard';
import { Input } from '../ui/Input';

export const AuthLoginView: React.FC = () => {
  const { login, isLoading, error: authError } = useAuth();
  const { t } = useI18n();

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

    try {
      await login(email, password);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Login failed';
      setValidationError(msg);
    }
  };

  return (
    <div id="auth-login-view" className="max-w-md mx-auto py-6 sm:py-12 space-y-6">
      <GlassCard variant="card" className="p-6 sm:p-8 space-y-6">
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-black tracking-tight text-white">
            {t('auth.welcomeBack')}
          </h2>
          <p className="text-xs sm:text-sm text-neutral-400">
            {t('auth.loginSubtitle')}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
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
            {t('auth.signInButton')}
          </Button>
        </form>

        {/* Instant Demo Sandbox Access */}
        <Button
          id="btn-auth-quick-demo"
          type="button"
          variant="secondary"
          size="md"
          onClick={() => {
            // Demo handled elsewhere
          }}
          leftIcon={<Play className="w-4 h-4 text-[#FF6B2B] fill-[#FF6B2B]/20" />}
          className="w-full border-white/10 hover:border-[#FF4E00]/40"
        >
          {t('auth.quickDemo')}
        </Button>

        <p className="text-[11px] text-neutral-400 text-center flex items-center justify-center gap-1.5 pt-1">
          <span className="w-3.5 h-3.5 text-neutral-400" />
          <span>{t('auth.demoNotice')}</span>
        </p>
      </GlassCard>
    </div>
  );
};

export const AuthSignupView: React.FC = () => {
  const { signup, isLoading, error: authError } = useAuth();
  const { t } = useI18n();

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

    if (!name.trim()) {
      setValidationError(t('auth.errorRequiredName'));
      return;
    }

    try {
      await signup(name, email, password);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Registration failed';
      setValidationError(msg);
    }
  };

  return (
    <div id="auth-signup-view" className="max-w-md mx-auto py-6 sm:py-12 space-y-6">
      <GlassCard variant="card" className="p-6 sm:p-8 space-y-6">
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-black tracking-tight text-white">
            {t('auth.createAccount')}
          </h2>
          <p className="text-xs sm:text-sm text-neutral-400">
            {t('auth.registerSubtitle')}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            id="input-auth-name"
            label={t('auth.nameLabel')}
            placeholder={t('auth.namePlaceholder')}
            value={name}
            onChange={(e) => setName(e.target.value)}
            leftIcon={<User className="w-4 h-4" />}
            required
          />

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
            {t('auth.signUpButton')}
          </Button>
        </form>

        {/* Instant Demo Sandbox Access */}
        <Button
          id="btn-auth-quick-demo"
          type="button"
          variant="secondary"
          size="md"
          leftIcon={<Play className="w-4 h-4 text-[#FF6B2B] fill-[#FF6B2B]/20" />}
          className="w-full border-white/10 hover:border-[#FF4E00]/40"
        >
          {t('auth.quickDemo')}
        </Button>

        <p className="text-[11px] text-neutral-400 text-center flex items-center justify-center gap-1.5 pt-1">
          <span className="w-3.5 h-3.5 text-neutral-400" />
          <span>{t('auth.demoNotice')}</span>
        </p>
      </GlassCard>
    </div>
  );
};