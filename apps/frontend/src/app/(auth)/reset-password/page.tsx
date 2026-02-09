'use client';

import { Suspense, useEffect, useState, useMemo, useCallback, memo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { LazyMotionDiv as motion } from '@/lib/performance/dynamic-motion';
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

const checkPasswordStrength = (password: string): PasswordStrength => {
  const requirements = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /[0-9]/.test(password),
  };

  const score = Object.values(requirements).filter(Boolean).length;

  const labels = ['Tres faible', 'Faible', 'Moyen', 'Fort'];
  const colors = ['bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-green-500'];

  return {
    score: Math.min(score, 4),
    label: labels[Math.min(score - 1, 3)] || labels[0],
    color: colors[Math.min(score - 1, 3)] || colors[0],
    requirements,
  };
};

function ResetPasswordPageContent() {
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

  const passwordStrength = useMemo(() => checkPasswordStrength(password), [password]);
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
          throw new Error("Token manquant dans l'URL");
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
          setError(
            'Le lien de reinitialisation est invalide ou a expire. Veuillez demander un nouveau lien.',
          );
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
  }, []);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setLoading(true);
      setError('');

      if (passwordStrength.score < 3) {
        setError('Veuillez choisir un mot de passe plus securise');
        setLoading(false);
        return;
      }

      if (password !== confirmPassword) {
        setError('Les mots de passe ne correspondent pas');
        setLoading(false);
        return;
      }

      try {
        const urlParams = new URLSearchParams(window.location.search);
        const token =
          urlParams.get('token') ||
          (window as Window & { __resetToken?: string }).__resetToken;

        if (!token) {
          setError('Token de reinitialisation manquant');
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
          throw new Error(data.message || 'Une erreur est survenue');
        }

        setSuccess(true);

        setTimeout(() => {
          router.push('/login');
        }, 3000);
      } catch (err: unknown) {
        setError(
          err instanceof Error ? err.message : 'Une erreur est survenue. Veuillez reessayer.',
        );
      } finally {
        setLoading(false);
      }
    },
    [password, confirmPassword, passwordStrength.score, router],
  );

  // Success state
  if (success) {
    return (
      <motion
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="text-center"
      >
        <div className="inline-flex items-center justify-center w-16 h-16 bg-green-50 rounded-2xl mb-5">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
          >
            <ShieldCheck className="w-7 h-7 text-green-600" />
          </motion.div>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Mot de passe modifie !</h1>
        <p className="text-gray-500 mb-6 leading-relaxed">
          Votre mot de passe a ete reinitialise avec succes.
          <br />
          Redirection vers la connexion...
        </p>
        <Link href="/login">
          <Button className="bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white h-11 px-6">
            Se connecter maintenant
          </Button>
        </Link>
      </motion>
    );
  }

  // Error state (invalid link)
  if (!isInitializing && !isReady && error) {
    return (
      <motion
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="text-center"
      >
        <div className="inline-flex items-center justify-center w-16 h-16 bg-red-50 rounded-2xl mb-5">
          <AlertCircle className="w-7 h-7 text-red-500" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Lien expire</h1>
        <p className="text-gray-500 mb-6 leading-relaxed">{error}</p>
        <div className="space-y-3">
          <Link href="/forgot-password">
            <Button className="w-full bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white h-11">
              Demander un nouveau lien
            </Button>
          </Link>
          <Link href="/login">
            <Button
              variant="outline"
              className="w-full border-gray-200 text-gray-700 hover:bg-gray-50 h-11"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Retour a la connexion
            </Button>
          </Link>
        </div>
      </motion>
    );
  }

  return (
    <motion
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      {/* Back Link */}
      <FadeIn delay={0.05}>
        <Link
          href="/login"
          className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Retour a la connexion
        </Link>
      </FadeIn>

      {/* Header */}
      <div className="text-center mb-8">
        <FadeIn delay={0.1}>
          <div className="inline-flex items-center justify-center w-14 h-14 bg-indigo-50 rounded-2xl mb-5 lg:hidden">
            <KeyRound className="w-6 h-6 text-indigo-600" />
          </div>
        </FadeIn>
        <SlideUp delay={0.2}>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
            Nouveau mot de passe
          </h1>
        </SlideUp>
        <FadeIn delay={0.3}>
          <p className="text-gray-500">
            Choisissez un mot de passe securise pour votre compte.
          </p>
        </FadeIn>
      </div>

      {/* Error */}
      {error && isReady && (
        <FadeIn>
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-600">{error}</p>
          </div>
        </FadeIn>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* New Password */}
        <SlideUp delay={0.4}>
          <div className="space-y-2">
            <Label htmlFor="password" className="text-sm font-medium text-gray-700">
              Nouveau mot de passe
            </Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                placeholder="Creez un mot de passe securise"
                className="pl-10 pr-12 bg-white border-gray-200 text-gray-900 placeholder:text-gray-400 focus:border-indigo-500 focus:ring-indigo-500/20 h-12"
                disabled={loading || !isReady}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>

            {/* Password Strength Indicator */}
            {password && (
              <motion
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="space-y-2"
              >
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden flex gap-0.5">
                    {[0, 1, 2, 3].map((i) => (
                      <div
                        key={i}
                        className={`h-full flex-1 rounded-full transition-colors ${
                          i < passwordStrength.score ? passwordStrength.color : 'bg-gray-100'
                        }`}
                      />
                    ))}
                  </div>
                  <span
                    className={`text-xs font-medium ${
                      passwordStrength.score <= 1
                        ? 'text-red-500'
                        : passwordStrength.score === 2
                          ? 'text-yellow-600'
                          : 'text-green-600'
                    }`}
                  >
                    {passwordStrength.label}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-1 text-xs">
                  {[
                    { key: 'length', label: '8 caracteres min.' },
                    { key: 'uppercase', label: '1 majuscule' },
                    { key: 'lowercase', label: '1 minuscule' },
                    { key: 'number', label: '1 chiffre' },
                  ].map(({ key, label }) => (
                    <div
                      key={key}
                      className={`flex items-center gap-1 ${
                        passwordStrength.requirements[
                          key as keyof typeof passwordStrength.requirements
                        ]
                          ? 'text-green-600'
                          : 'text-gray-400'
                      }`}
                    >
                      {passwordStrength.requirements[
                        key as keyof typeof passwordStrength.requirements
                      ] ? (
                        <Check className="w-3 h-3" />
                      ) : (
                        <X className="w-3 h-3" />
                      )}
                      {label}
                    </div>
                  ))}
                </div>
              </motion>
            )}
          </div>
        </SlideUp>

        {/* Confirm Password */}
        <SlideUp delay={0.5}>
          <div className="space-y-2">
            <Label htmlFor="confirmPassword" className="text-sm font-medium text-gray-700">
              Confirmer le mot de passe
            </Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                id="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                placeholder="Confirmez votre mot de passe"
                className={`pl-10 pr-12 bg-white text-gray-900 placeholder:text-gray-400 focus:ring-indigo-500/20 h-12 ${
                  confirmPassword && !passwordsMatch
                    ? 'border-red-300 focus:border-red-400'
                    : 'border-gray-200 focus:border-indigo-500'
                }`}
                disabled={loading || !isReady}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
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
              <p className="text-xs text-red-500">Les mots de passe ne correspondent pas</p>
            )}
            {passwordsMatch && (
              <p className="text-xs text-green-600 flex items-center gap-1">
                <Check className="w-3 h-3" /> Les mots de passe correspondent
              </p>
            )}
          </div>
        </SlideUp>

        {/* Submit */}
        <SlideUp delay={0.6}>
          <Button
            type="submit"
            disabled={loading || !isReady || !isFormValid}
            className="w-full bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white h-12 font-medium shadow-lg shadow-indigo-500/25 disabled:opacity-50 disabled:cursor-not-allowed mt-4"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Reinitialisation...
              </>
            ) : (
              'Reinitialiser mon mot de passe'
            )}
          </Button>
        </SlideUp>
      </form>
    </motion>
  );
}

const ResetPasswordPageContentMemo = memo(ResetPasswordPageContent);

export default function ResetPasswordPage() {
  return (
    <ErrorBoundary componentName="ResetPasswordPage">
      <Suspense
        fallback={
          <div className="flex flex-col items-center justify-center min-h-[400px]">
            <Loader2 className="w-8 h-8 text-indigo-600 animate-spin mb-4" />
            <p className="text-gray-500">Verification du lien...</p>
          </div>
        }
      >
        <ResetPasswordPageContentMemo />
      </Suspense>
    </ErrorBoundary>
  );
}
