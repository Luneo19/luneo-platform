'use client';

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { useI18n } from '@/i18n/useI18n';
import { LazyMotionDiv as motion } from '@/lib/performance/dynamic-motion';
import { FadeIn, SlideUp } from '@/components/animations';
import {
  Eye,
  EyeOff,
  Mail,
  Lock,
  User,
  ArrowRight,
  Loader2,
  Building,
  AlertCircle,
  CheckCircle,
  Shield,
  Check,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { getBackendUrl } from '@/lib/api/server-url';
import { logger } from '@/lib/logger';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { memo } from 'react';

// Google Icon Component
const GoogleIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24">
    <path
      fill="#4285F4"
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
    />
    <path
      fill="#34A853"
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
    />
    <path
      fill="#FBBC05"
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
    />
    <path
      fill="#EA4335"
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
    />
  </svg>
);

// GitHub Icon Component
const GitHubIcon = () => (
  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
  </svg>
);

// Password strength checker
interface PasswordStrength {
  score: number; // 0-4
  label: string;
  color: string;
  requirements: {
    length: boolean;
    uppercase: boolean;
    lowercase: boolean;
    number: boolean;
    special: boolean;
  };
}

const STRENGTH_KEYS = ['veryWeak', 'weak', 'medium', 'strong', 'veryStrong'] as const;

const checkPasswordStrength = (
  password: string,
  t: (key: string) => string
): PasswordStrength => {
  const requirements = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /[0-9]/.test(password),
    special: /[!@#$%^&*(),.?":{}|<>]/.test(password),
  };

  const score = Object.values(requirements).filter(Boolean).length;
  const idx = Math.min(score, 4);
  const colors = ['bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-green-400', 'bg-green-500'];

  return {
    score: idx,
    label: t(`auth.register.passwordStrength.${STRENGTH_KEYS[idx]}`),
    color: colors[idx],
    requirements,
  };
};

function RegisterPageContent() {
  const { t } = useI18n();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState<'google' | 'github' | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [planFromUrl, setPlanFromUrl] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    company: '',
    password: '',
    confirmPassword: '',
  });

  const [billingInterval, setBillingInterval] = useState<string | null>(null);
  const [referralCode, setReferralCode] = useState('');
  useEffect(() => {
    const plan = searchParams.get('plan');
    if (plan) setPlanFromUrl(plan);
    const interval = searchParams.get('interval');
    if (interval) setBillingInterval(interval);
    const ref = searchParams.get('ref') || searchParams.get('referralCode');
    if (ref) setReferralCode(ref);
  }, [searchParams]);

  // Password strength
  const passwordStrength = useMemo(() => 
    checkPasswordStrength(formData.password, t), 
    [formData.password, t]
  );

  // Email validation
  const isValidEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  // Check if passwords match
  const passwordsMatch = useMemo(() => 
    formData.password === formData.confirmPassword && formData.confirmPassword.length > 0,
    [formData.password, formData.confirmPassword]
  );

  // Form validation
  const isFormValid = useMemo(() => {
    return (
      formData.fullName.length >= 2 &&
      isValidEmail(formData.email) &&
      passwordStrength.score >= 2 &&
      passwordsMatch &&
      acceptedTerms
    );
  }, [formData, passwordStrength.score, passwordsMatch, acceptedTerms]);

  // Register with email/password
  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccess('');

    // Validation
    if (!formData.fullName.trim()) {
      setError(t('auth.register.errors.fullNameRequired'));
      setIsLoading(false);
      return;
    }

    if (!isValidEmail(formData.email)) {
      setError(t('auth.register.errors.invalidEmail'));
      setIsLoading(false);
      return;
    }

    if (passwordStrength.score < 2) {
      setError(t('auth.register.errors.weakPassword'));
      setIsLoading(false);
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError(t('auth.register.errors.passwordsMismatch'));
      setIsLoading(false);
      return;
    }

    if (!acceptedTerms) {
      setError(t('auth.register.errors.acceptTerms'));
      setIsLoading(false);
      return;
    }

    try {
      // Split fullName into firstName and lastName
      const nameParts = formData.fullName.trim().split(/\s+/);
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';

        // Get CAPTCHA token (optional - continue without it if not configured)
        let captchaToken = '';
        try {
          const { executeRecaptcha } = await import('@/lib/captcha/recaptcha');
          captchaToken = await executeRecaptcha('register');
        } catch {
          // CAPTCHA not configured or failed to load — proceed without it
          // The backend will skip CAPTCHA verification if no token is provided
          captchaToken = '';
        }

        // Use relative URL so the request goes through the Vercel proxy (same-origin).
        // This ensures httpOnly cookies from Set-Cookie are properly stored by the browser.
        const signupResp = await fetch('/api/v1/auth/signup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            email: formData.email,
            password: formData.password,
            firstName,
            lastName,
            captchaToken,
            ...(formData.company && { company: formData.company }),
            ...(planFromUrl && { plan: planFromUrl }),
            ...(referralCode && { referralCode }),
          }),
        });

        if (!signupResp.ok) {
          const errData = await signupResp.json().catch(() => ({}));
          throw new Error(errData.message || 'Registration failed');
        }

        const response = await signupResp.json();

      // Success: user in body; tokens are in httpOnly cookies (set by backend via Set-Cookie)
      if (response.user) {
        setSuccess(t('auth.register.accountCreated'));
        
        // Small delay to let browser process Set-Cookie headers
        await new Promise(r => setTimeout(r, 300));
        
        try {
          const verifyResp = await fetch('/api/v1/auth/me', { credentials: 'include' });
          if (verifyResp.ok) {
            setSuccess(t('auth.register.sessionVerified'));
          }
        } catch {
          // Verification failed silently — continue with navigation
        }

        // If a paid plan was selected, redirect to onboarding first, then billing
        // For free plan or no plan, just go to onboarding
        const isPaidPlan = planFromUrl && planFromUrl !== 'free';
        const onboardingParams = new URLSearchParams();
        if (isPaidPlan) onboardingParams.set('plan', planFromUrl);
        if (billingInterval) onboardingParams.set('interval', billingInterval);
        const qs = onboardingParams.toString();
        window.location.href = qs ? `/onboarding?${qs}` : '/onboarding';
      } else {
        setError(t('auth.register.errors.invalidResponse'));
      }
    } catch (err: unknown) {
      logger.error('Registration error', {
        error: err,
        email: formData.email,
        message: err instanceof Error ? err.message : 'Unknown error',
      });
      
      // Handle specific error messages
      if (err instanceof Error) {
        if (err.message.includes('already exists') || err.message.includes('409')) {
          setError(t('auth.register.errors.emailExists'));
        } else {
          setError(err.message || t('auth.register.errors.generic'));
        }
      } else {
        setError(t('auth.register.errors.generic'));
      }
    } finally {
      setIsLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData, passwordStrength.score, acceptedTerms, planFromUrl]);

  // OAuth register - ✅ Migré vers NestJS backend
  const handleOAuthRegister = useCallback(async (provider: 'google' | 'github') => {
    try {
      setOauthLoading(provider);
      setError('');
      
      // Redirect to backend OAuth endpoint
      const apiUrl = getBackendUrl();
      const oauthUrl = `${apiUrl}/api/v1/auth/${provider}`;
      
      // Redirect to backend OAuth
      window.location.href = oauthUrl;
    } catch (err: unknown) {
      logger.error('OAuth registration error', {
        error: err,
        provider,
        message: err instanceof Error ? err.message : 'Unknown error',
      });
      setError(t('auth.register.oauthError'));
      setOauthLoading(null);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
      <motion
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="w-full"
      >
      {/* Header */}
      <div className="text-center mb-6">
        <FadeIn delay={0.1}>
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-purple-600 to-pink-600 rounded-2xl mb-6 shadow-lg shadow-purple-500/25 lg:hidden">
            <span className="text-white font-bold text-2xl">L</span>
          </div>
        </FadeIn>
        <SlideUp delay={0.2}>
          <h1 data-testid="register-title" className="text-2xl sm:text-3xl font-bold text-white mb-2 font-display">
            {t('auth.register.title')}
          </h1>
        </SlideUp>
        <FadeIn delay={0.3}>
          <p className="text-slate-500">
            {t('auth.register.subtitle')}
          </p>
        </FadeIn>
          </div>

          {/* Error Message */}
          {error && (
        <FadeIn>
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-600">{error}</p>
          </div>
        </FadeIn>
          )}

          {/* Success Message */}
          {success && (
        <FadeIn>
          <div className="mb-6 p-4 bg-green-500/10 border border-green-500/30 rounded-xl flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-green-600">{success}</p>
              <p className="text-xs text-green-600/70 mt-1">{t('auth.register.redirecting')}</p>
            </div>
          </div>
        </FadeIn>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
        {/* Full Name */}
        <SlideUp delay={0.4}>
        <div className="space-y-2">
          <Label htmlFor="fullName" className="text-sm font-medium text-slate-300 block mb-1.5">
            {t('auth.register.name')} <span className="text-red-400">*</span>
              </Label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-600 w-5 h-5 z-10" />
                <Input
                  id="fullName"
                  data-testid="register-name"
                  type="text"
                  placeholder={t('auth.register.namePlaceholder')}
              className="pl-10 bg-dark-surface border border-dark-border text-white placeholder:text-slate-600 focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/20 h-12 text-base"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  required
              disabled={isLoading}
                />
            {formData.fullName.length >= 2 && (
              <CheckCircle className="absolute right-3 top-1/2 transform -translate-y-1/2 text-green-400 w-5 h-5" />
            )}
              </div>
            </div>
        </SlideUp>

        {/* Email */}
        <SlideUp delay={0.5}>
        <div className="space-y-2">
          <Label htmlFor="email" className="text-sm font-medium text-slate-300 block mb-1.5">
            {t('auth.register.email')} <span className="text-red-400">*</span>
              </Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-600 w-5 h-5 z-10" />
                <Input
                  id="email"
                  data-testid="register-email"
                  type="email"
              placeholder={t('auth.register.emailPlaceholder')}
              className="pl-10 bg-dark-surface border border-dark-border text-white placeholder:text-slate-600 focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/20 h-12 text-base"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
              disabled={isLoading}
                />
            {formData.email && isValidEmail(formData.email) && (
              <CheckCircle className="absolute right-3 top-1/2 transform -translate-y-1/2 text-green-400 w-5 h-5" />
            )}
              </div>
            </div>
        </SlideUp>

        {/* Company */}
        <SlideUp delay={0.6}>
        <div className="space-y-2">
          <Label htmlFor="company" className="text-sm font-medium text-slate-300 block mb-1.5">
            {t('auth.register.company')} <span className="text-gray-500">{t('auth.register.companyOptional')}</span>
              </Label>
          <div className="relative">
            <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-600 w-5 h-5 z-10" />
                <Input
                  id="company"
                  type="text"
                  placeholder={t('auth.register.company')}
              className="pl-10 bg-dark-surface border border-dark-border text-white placeholder:text-slate-600 focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/20 h-12 text-base"
                  value={formData.company}
                  onChange={(e) => setFormData({ ...formData, company: e.target.value })}
              disabled={isLoading}
                />
              </div>
            </div>
        </SlideUp>

        {/* Password */}
        <SlideUp delay={0.7}>
        <div className="space-y-2">
          <Label htmlFor="password" className="text-sm font-medium text-slate-300 block mb-1.5">
            {t('auth.register.password')} <span className="text-red-400">*</span>
              </Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-600 w-5 h-5 z-10" />
                <Input
                  id="password"
                  data-testid="register-password"
                  type={showPassword ? 'text' : 'password'}
              placeholder={t('auth.register.passwordPlaceholder')}
              className="pl-10 pr-12 bg-dark-surface border-dark-border text-white placeholder:text-slate-600 focus:border-purple-500/50 focus:ring-purple-500/20 h-12 text-base"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
              disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-600 hover:text-slate-400 transition-colors z-10"
              tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
          </div>

          {/* Password Strength Indicator */}
          {formData.password && (
            <motion
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="space-y-2"
            >
              {/* Strength bar */}
              <div className="flex items-center gap-2">
                <div className="flex-1 h-1.5 bg-white/[0.06] rounded-full overflow-hidden flex gap-0.5">
                  {[0, 1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      className={`h-full flex-1 rounded-full transition-colors ${
                        i < passwordStrength.score ? passwordStrength.color : 'bg-white/[0.06]'
                      }`}
                    />
                  ))}
                </div>
                <span className={`text-xs font-medium ${
                  passwordStrength.score <= 1 ? 'text-red-400' :
                  passwordStrength.score === 2 ? 'text-yellow-400' :
                  'text-green-400'
                }`}>
                  {passwordStrength.label}
                </span>
              </div>

              {/* Requirements checklist */}
              <div className="grid grid-cols-2 gap-1 text-xs">
                {[
                  { key: 'length', labelKey: 'auth.register.requirements.minLength' },
                  { key: 'uppercase', labelKey: 'auth.register.requirements.uppercase' },
                  { key: 'lowercase', labelKey: 'auth.register.requirements.lowercase' },
                  { key: 'number', labelKey: 'auth.register.requirements.number' },
                ].map(({ key, labelKey }) => (
                  <div 
                    key={key} 
                    className={`flex items-center gap-1 ${
                      passwordStrength.requirements[key as keyof typeof passwordStrength.requirements]
                        ? 'text-green-400'
                        : 'text-slate-500'
                    }`}
                  >
                    {passwordStrength.requirements[key as keyof typeof passwordStrength.requirements] ? (
                      <Check className="w-3 h-3" />
                    ) : (
                      <X className="w-3 h-3" />
                    )}
                    {t(labelKey)}
                  </div>
                ))}
              </div>
            </motion>
          )}
            </div>
        </SlideUp>

        {/* Confirm Password */}
        <SlideUp delay={0.8}>
        <div className="space-y-2">
          <Label htmlFor="confirmPassword" className="text-sm font-medium text-slate-300 block mb-1.5">
            {t('auth.register.confirmPassword')} <span className="text-red-400">*</span>
              </Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-600 w-5 h-5 z-10" />
                <Input
                  id="confirmPassword"
                  data-testid="register-confirm-password"
              type={showConfirmPassword ? 'text' : 'password'}
              placeholder={t('auth.register.confirmPasswordPlaceholder')}
              className={`pl-10 pr-12 bg-dark-surface border text-white placeholder:text-slate-600 focus:ring-1 focus:ring-purple-500/20 h-12 text-base ${
                formData.confirmPassword && !passwordsMatch 
                  ? 'border-red-500/50 focus:border-red-500/50' 
                  : 'border-dark-border focus:border-purple-500/50'
              }`}
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  required
              disabled={isLoading}
                />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-600 hover:text-slate-400 transition-colors z-10"
              tabIndex={-1}
            >
              {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
              </div>
          {formData.confirmPassword && !passwordsMatch && (
            <p className="text-xs text-red-400">{t('auth.register.passwordsDoNotMatch')}</p>
          )}
          {passwordsMatch && (
            <p className="text-xs text-green-400 flex items-center gap-1">
              <Check className="w-3 h-3" /> {t('auth.register.passwordsMatch')}
            </p>
          )}
            </div>
        </SlideUp>

        {/* Terms acceptance */}
        <SlideUp delay={0.9}>
        <div className="flex items-start gap-3 pt-2">
              <input
                id="terms"
                type="checkbox"
            checked={acceptedTerms}
            onChange={(e) => setAcceptedTerms(e.target.checked)}
            className="w-5 h-5 mt-0.5 rounded border border-dark-border bg-dark-surface text-purple-500 focus:ring-1 focus:ring-purple-500/20 focus:ring-offset-0 cursor-pointer"
                required
              />
          <Label htmlFor="terms" className="text-sm text-slate-400 cursor-pointer leading-relaxed flex-1">
            {t('auth.register.acceptPrefix')}
            <Link href="/legal/terms" className="text-purple-400 hover:text-purple-300 underline font-medium">
              {t('auth.register.termsAndPrivacy')}
                </Link>
            {t('auth.register.andThe')}
            <Link href="/legal/privacy" className="text-purple-400 hover:text-purple-300 underline font-medium">
                  {t('auth.register.privacyPolicy')}
                </Link>
              </Label>
            </div>
        </SlideUp>

        {/* Submit Button */}
        <SlideUp delay={1.0}>
            <Button
              type="submit"
              data-testid="register-submit"
          disabled={isLoading || !isFormValid}
          className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white h-12 text-base font-bold shadow-lg shadow-purple-500/25 hover:shadow-xl hover:shadow-purple-500/30 hover:scale-[1.01] active:scale-[0.99] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 mt-6"
            >
              {isLoading ? (
                <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  {t('auth.register.submitting')}
                </>
              ) : (
                <>
              {t('auth.register.submit')}
              <ArrowRight className="w-5 h-5 ml-2" />
                </>
              )}
            </Button>
        </SlideUp>
          </form>

          {/* Divider */}
        <FadeIn delay={1.1}>
      <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-white/[0.06]" />
              </div>
              <div className="relative flex justify-center text-sm">
          <span className="px-4 bg-dark-bg text-slate-600">{t('auth.register.orRegisterWith')}</span>
            </div>
          </div>
        </FadeIn>

          {/* Social Register */}
        <SlideUp delay={1.2}>
      <div className="grid grid-cols-2 gap-3">
            <Button
              type="button"
              variant="outline"
              data-testid="register-oauth-google"
              aria-label={t('auth.register.signUpWithGoogle')}
          className="bg-white/[0.04] border border-white/[0.08] hover:bg-white/[0.08] hover:border-white/[0.12] text-slate-300 h-12 text-sm sm:text-base"
              onClick={() => handleOAuthRegister('google')}
          disabled={isLoading || oauthLoading !== null}
            >
          {oauthLoading === 'google' ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <>
              <GoogleIcon />
              <span className="ml-2 hidden sm:inline">Google</span>
            </>
          )}
            </Button>

            <Button
              type="button"
              variant="outline"
              data-testid="register-oauth-github"
              aria-label={t('auth.register.signUpWithGithub')}
          className="bg-white/[0.04] border border-white/[0.08] hover:bg-white/[0.08] hover:border-white/[0.12] text-slate-300 h-12 text-sm sm:text-base"
              onClick={() => handleOAuthRegister('github')}
          disabled={isLoading || oauthLoading !== null}
            >
          {oauthLoading === 'github' ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <>
              <GitHubIcon />
              <span className="ml-2 hidden sm:inline">GitHub</span>
            </>
          )}
            </Button>
          </div>
        </SlideUp>

          {/* Sign in link */}
        <FadeIn delay={1.3}>
      <div className="mt-6 text-center">
        <p className="text-sm text-slate-500">
              {t('auth.register.hasAccount')}{' '}
          <Link
            href="/login"
            data-testid="register-switch-login"
            className="text-purple-400 hover:text-purple-300 font-medium transition-colors"
          >
                {t('auth.register.login')}
              </Link>
            </p>
          </div>
        </FadeIn>

      {/* Trial info */}
        <FadeIn delay={1.4}>
      <div className="mt-6 pt-4 border-t border-white/[0.06]">
        <div className="flex items-center justify-center gap-4 text-xs text-slate-600">
          <div className="flex items-center gap-1">
            <CheckCircle className="w-3 h-3 text-green-400" />
            <span>{t('auth.register.freePlanIncluded')}</span>
          </div>
          <div className="flex items-center gap-1">
            <CheckCircle className="w-3 h-3 text-green-400" />
            <span>{t('auth.register.noCreditCard')}</span>
          </div>
          <div className="flex items-center gap-1">
            <Shield className="w-3 h-3 text-green-400" />
            <span>RGPD</span>
          </div>
        </div>
      </div>
        </FadeIn>
      </motion>
  );
}

const RegisterPageContentMemo = memo(RegisterPageContent);

export default function RegisterPage() {
  return (
    <ErrorBoundary componentName="RegisterPage">
      <RegisterPageContentMemo />
    </ErrorBoundary>
  );
}
