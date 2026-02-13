'use client';

import { Suspense, useEffect, useState, useMemo, useCallback, memo } from 'react';
import { useI18n } from '@/i18n/useI18n';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { LazyMotionDiv } from '@/lib/performance/dynamic-motion';
import { FadeIn, SlideUp } from '@/components/animations';
import {
  Lock,
  Eye,
  EyeOff,
  ArrowLeft,
  CheckCircle,
  AlertCircle,
  Loader2,
  KeyRound,
  Check,
  X,
  ShieldCheck,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { getBackendUrl } from '@/lib/api/server-url';
import { logger } from '@/lib/logger';
import { ErrorBoundary } from '@/components/ErrorBoundary';

// Password strength checker
interface PasswordStrength {
  score: number;
  label: string;
  color: string;
  requirements: {
    length: boolean;
    uppercase: boolean;
    lowercase: boolean;
    number: boolean;
  };
}

const RESET_STRENGTH_KEYS = ['veryWeak', 'weak', 'medium', 'strong'] as const;

const checkPasswordStrength = (
  password: string,
  t: (key: string) => string
): PasswordStrength => {
  const requirements = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /[0-9]/.test(password),
  };

  const score = Object.values(requirements).filter(Boolean).length;
  const idx = Math.min(Math.max(score - 1, 0), 3);
  const colors = ['bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-green-500'];

  return {
    score: Math.min(score, 4),
    label: t(`auth.resetPassword.passwordStrength.${RESET_STRENGTH_KEYS[idx]}`),
    color: colors[idx] || colors[0],
    requirements,
  };
};

function ResetPasswordPageContent() {
  const { t } = useI18n();
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [isReady, setIsReady] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);

  const passwordStrength = useMemo(() => checkPasswordStrength(password, t), [password, t]);
  const passwordsMatch = useMemo(
    () => password === confirmPassword && confirmPassword.length > 0,
    [password, confirmPassword],
  );
  const isFormValid = useMemo(
    () => passwordStrength.score >= 3 && passwordsMatch,
    [passwordStrength.score, passwordsMatch],
  );

  useEffect(() => {
    let isMounted = true;

    const init = async () => {
      try {
        const urlParams = new URLSearchParams(window.location.search);
        const token = urlParams.get('token');

        if (!token) {
          throw new Error(t('auth.resetPassword.tokenMissing'));
        }

        if (isMounted) {
          setIsReady(true);
          (window as Window & { __resetToken?: string }).__resetToken = token;
        }
      } catch (err) {
        logger.error('Token validation error', {
          error: err,
          message: err instanceof Error ? err.message : 'Unknown error',
        });
        if (isMounted) {
          setError(t('auth.resetPassword.linkInvalidOrExpired'));
        }
      } finally {
        if (isMounted) {
          setIsInitializing(false);
        }
      }
    };

    init();
    return () => {
      isMounted = false;
    };
  }, [t]);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setLoading(true);
      setError('');

      if (passwordStrength.score < 3) {
        setError(t('auth.resetPassword.errors.weakPassword'));
        setLoading(false);
        return;
      }

      if (password !== confirmPassword) {
        setError(t('auth.resetPassword.errors.passwordsMismatch'));
        setLoading(false);
        return;
      }

      try {
        const urlParams = new URLSearchParams(window.location.search);
        const token =
          urlParams.get('token') ||
          (window as Window & { __resetToken?: string }).__resetToken;

        if (!token) {
          setError(t('auth.resetPassword.tokenInvalid'));
          setLoading(false);
          return;
        }

        const apiUrl = getBackendUrl();
        const response = await fetch(`${apiUrl}/api/v1/auth/reset-password`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token, password }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || t('auth.resetPassword.errors.generic'));
        }

        setSuccess(true);

        setTimeout(() => {
          router.push('/login');
        }, 3000);
      } catch (err: unknown) {
        setError(
          err instanceof Error ? err.message : t('auth.resetPassword.errors.generic'),
        );
      } finally {
        setLoading(false);
      }
    },
    [password, confirmPassword, passwordStrength.score, router, t],
  );

  // Success state
  if (success) {
    return (
      <LazyMotionDiv
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="text-center"
      >
        <div className="inline-flex items-center justify-center w-16 h-16 bg-green-500/10 rounded-2xl mb-5">
          <LazyMotionDiv
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
          >
            <ShieldCheck className="w-7 h-7 text-green-400" />
          </LazyMotionDiv>
        </div>
        <h1 className="text-2xl font-bold text-white mb-2">{t('auth.resetPassword.successTitle')}</h1>
        <p className="text-slate-400 mb-6 leading-relaxed">
          {t('auth.resetPassword.successMessage')}
          <br />
          {t('auth.resetPassword.redirecting')}
        </p>
        <Link href="/login">
          <Button className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white h-11 px-6 shadow-lg shadow-purple-500/25">
            {t('auth.resetPassword.signInNow')}
          </Button>
        </Link>
      </LazyMotionDiv>
    );
  }

  // Error state (invalid link)
  if (!isInitializing && !isReady && error) {
    return (
      <LazyMotionDiv
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="text-center"
      >
        <div className="inline-flex items-center justify-center w-16 h-16 bg-red-500/10 rounded-2xl mb-5">
          <AlertCircle className="w-7 h-7 text-red-400" />
        </div>
        <h1 className="text-2xl font-bold text-white mb-2">{t('auth.resetPassword.expireTitle')}</h1>
        <p className="text-slate-400 mb-6 leading-relaxed">{error}</p>
        <div className="space-y-3">
          <Link href="/forgot-password">
            <Button className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white h-11 shadow-lg shadow-purple-500/25">
              {t('auth.resetPassword.requestNewLink')}
            </Button>
          </Link>
          <Link href="/login">
            <Button
              variant="outline"
              className="w-full border-white/[0.08] text-slate-300 hover:bg-white/[0.04] hover:text-white h-11"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              {t('auth.resetPassword.backToLogin')}
            </Button>
          </Link>
        </div>
      </LazyMotionDiv>
    );
  }

  return (
    <LazyMotionDiv
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      {/* Back Link */}
      <FadeIn delay={0.05}>
        <Link
          href="/login"
          className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-white mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          {t('auth.resetPassword.backToLogin')}
        </Link>
      </FadeIn>

      {/* Header */}
      <div className="text-center mb-8">
        <FadeIn delay={0.1}>
          <div className="inline-flex items-center justify-center w-14 h-14 bg-purple-500/10 rounded-2xl mb-5 lg:hidden">
            <KeyRound className="w-6 h-6 text-purple-400" />
          </div>
        </FadeIn>
        <SlideUp delay={0.2}>
          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">
            {t('auth.resetPassword.title')}
          </h1>
        </SlideUp>
        <FadeIn delay={0.3}>
          <p className="text-slate-400">
            {t('auth.resetPassword.subtitle')}
          </p>
        </FadeIn>
      </div>

      {/* Error */}
      {error && isReady && (
        <FadeIn>
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-300">{error}</p>
          </div>
        </FadeIn>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* New Password */}
        <SlideUp delay={0.4}>
          <div className="space-y-2">
            <Label htmlFor="password" className="text-sm font-medium text-slate-300">
              {t('auth.resetPassword.newPassword')}
            </Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-600 w-5 h-5" />
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                placeholder={t('auth.resetPassword.newPasswordPlaceholder')}
                className="pl-10 pr-12 bg-white/[0.04] border-white/[0.08] text-white placeholder:text-slate-600 focus:border-purple-500/50 focus:ring-purple-500/20 h-12"
                disabled={loading || !isReady}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-600 hover:text-slate-400 transition-colors"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>

            {/* Password Strength Indicator */}
            {password && (
              <LazyMotionDiv
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="space-y-2"
              >
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-1.5 bg-white/[0.06] rounded-full overflow-hidden flex gap-0.5">
                    {[0, 1, 2, 3].map((i) => (
                      <div
                        key={i}
                        className={`h-full flex-1 rounded-full transition-colors ${
                          i < passwordStrength.score ? passwordStrength.color : 'bg-white/[0.06]'
                        }`}
                      />
                    ))}
                  </div>
                  <span
                    className={`text-xs font-medium ${
                      passwordStrength.score <= 1
                        ? 'text-red-400'
                        : passwordStrength.score === 2
                          ? 'text-yellow-400'
                          : 'text-green-400'
                    }`}
                  >
                    {passwordStrength.label}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-1 text-xs">
                  {[
                    { key: 'length', labelKey: 'auth.resetPassword.requirements.minLength' },
                    { key: 'uppercase', labelKey: 'auth.resetPassword.requirements.uppercase' },
                    { key: 'lowercase', labelKey: 'auth.resetPassword.requirements.lowercase' },
                    { key: 'number', labelKey: 'auth.resetPassword.requirements.number' },
                  ].map(({ key, labelKey }) => (
                    <div
                      key={key}
                      className={`flex items-center gap-1 ${
                        passwordStrength.requirements[
                          key as keyof typeof passwordStrength.requirements
                        ]
                          ? 'text-green-400'
                          : 'text-slate-600'
                      }`}
                    >
                      {passwordStrength.requirements[
                        key as keyof typeof passwordStrength.requirements
                      ] ? (
                        <Check className="w-3 h-3" />
                      ) : (
                        <X className="w-3 h-3" />
                      )}
                      {t(labelKey)}
                    </div>
                  ))}
                </div>
              </LazyMotionDiv>
            )}
          </div>
        </SlideUp>

        {/* Confirm Password */}
        <SlideUp delay={0.5}>
          <div className="space-y-2">
            <Label htmlFor="confirmPassword" className="text-sm font-medium text-slate-300">
              {t('auth.resetPassword.confirmPassword')}
            </Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-600 w-5 h-5" />
              <Input
                id="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                placeholder={t('auth.resetPassword.confirmPasswordPlaceholder')}
                className={`pl-10 pr-12 bg-white/[0.04] text-white placeholder:text-slate-600 focus:ring-purple-500/20 h-12 ${
                  confirmPassword && !passwordsMatch
                    ? 'border-red-500/30 focus:border-red-400/50'
                    : 'border-white/[0.08] focus:border-purple-500/50'
                }`}
                disabled={loading || !isReady}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-600 hover:text-slate-400 transition-colors"
                tabIndex={-1}
              >
                {showConfirmPassword ? (
                  <EyeOff className="w-5 h-5" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
              </button>
            </div>
            {confirmPassword && !passwordsMatch && (
              <p className="text-xs text-red-400">{t('auth.resetPassword.passwordsDoNotMatch')}</p>
            )}
            {passwordsMatch && (
              <p className="text-xs text-green-400 flex items-center gap-1">
                <Check className="w-3 h-3" /> {t('auth.resetPassword.passwordsMatch')}
              </p>
            )}
          </div>
        </SlideUp>

        {/* Submit */}
        <SlideUp delay={0.6}>
          <Button
            type="submit"
            disabled={loading || !isReady || !isFormValid}
            className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white h-12 font-medium shadow-lg shadow-purple-500/25 disabled:opacity-50 disabled:cursor-not-allowed mt-4"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                {t('auth.resetPassword.submitting')}
              </>
            ) : (
              t('auth.resetPassword.submit')
            )}
          </Button>
        </SlideUp>
      </form>
    </LazyMotionDiv>
  );
}

const ResetPasswordPageContentMemo = memo(ResetPasswordPageContent);

function ResetPasswordFallback() {
  const { t } = useI18n();
  return <p className="text-slate-400">{t('auth.resetPassword.verifyingLink')}</p>;
}

export default function ResetPasswordPage() {
  return (
    <ErrorBoundary componentName="ResetPasswordPage">
      <Suspense
        fallback={
          <div className="flex flex-col items-center justify-center min-h-[400px]">
            <Loader2 className="w-8 h-8 text-purple-500 animate-spin mb-4" />
            <ResetPasswordFallback />
          </div>
        }
      >
        <ResetPasswordPageContentMemo />
      </Suspense>
    </ErrorBoundary>
  );
}
