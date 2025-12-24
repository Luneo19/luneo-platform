'use client';

import React, { useState, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
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
import { useRouter } from 'next/navigation';
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

const checkPasswordStrength = (password: string): PasswordStrength => {
  const requirements = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /[0-9]/.test(password),
    special: /[!@#$%^&*(),.?":{}|<>]/.test(password),
  };

  const score = Object.values(requirements).filter(Boolean).length;

  const labels = ['Très faible', 'Faible', 'Moyen', 'Fort', 'Très fort'];
  const colors = ['bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-green-400', 'bg-green-500'];

  return {
    score: Math.min(score, 4),
    label: labels[Math.min(score, 4)],
    color: colors[Math.min(score, 4)],
    requirements,
  };
};

function RegisterPageContent() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState<'google' | 'github' | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    company: '',
    password: '',
    confirmPassword: '',
  });
  const router = useRouter();

  // Password strength
  const passwordStrength = useMemo(() => 
    checkPasswordStrength(formData.password), 
    [formData.password]
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
      setError('Veuillez entrer votre nom complet');
      setIsLoading(false);
      return;
    }

    if (!isValidEmail(formData.email)) {
      setError('Veuillez entrer une adresse email valide');
      setIsLoading(false);
      return;
    }

    if (passwordStrength.score < 2) {
      setError('Veuillez choisir un mot de passe plus sécurisé');
      setIsLoading(false);
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Les mots de passe ne correspondent pas');
      setIsLoading(false);
      return;
    }

    if (!acceptedTerms) {
      setError("Veuillez accepter les conditions d'utilisation");
      setIsLoading(false);
      return;
    }

    try {
      const { createClient } = await import('@/lib/supabase/client');
      const supabase = createClient();

      const { data, error: signUpError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            full_name: formData.fullName,
            company: formData.company || undefined,
          },
          emailRedirectTo: `${window.location.origin}/auth/callback?next=/overview`,
        },
      });

      if (signUpError) {
        if (signUpError.message.includes('already registered')) {
          setError('Un compte existe déjà avec cette adresse email. Essayez de vous connecter.');
        } else {
        setError(signUpError.message);
        }
        return;
      }

      if (data.user) {
        // Optional: Call onboarding API
        try {
          await fetch('/api/auth/onboarding', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              userId: data.user.id,
              email: formData.email,
              fullName: formData.fullName,
              company: formData.company,
            }),
          });
        } catch (onboardingError) {
          logger.warn('Onboarding API failed (non-blocking)', {
            error: onboardingError,
            userId: data.user?.id,
          });
        }

        // Check if user has a session (email confirmation might be disabled)
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session && data.session) {
          // User is automatically logged in (email confirmation disabled)
          // Store token for API calls
          if (data.session.access_token) {
            localStorage.setItem('accessToken', data.session.access_token);
          }
          
          setSuccess('🎉 Compte créé avec succès ! Redirection...');
          
          // Wait for session to be fully established
          setTimeout(async () => {
            // Verify session is available before redirecting
            const { data: { session: verifySession } } = await supabase.auth.getSession();
            if (verifySession) {
              // Use window.location for a full page reload to ensure cookies are set
              window.location.href = '/overview';
            } else {
              // Fallback: try router.push if session verification fails
              router.push('/overview');
              router.refresh();
            }
          }, 800);
        } else {
          // Email confirmation required
          setSuccess(
            '🎉 Compte créé avec succès ! Vérifiez votre email pour activer votre compte.'
          );
          
          // Reset form
          setFormData({
            fullName: '',
            email: '',
            company: '',
            password: '',
            confirmPassword: '',
          });
          setAcceptedTerms(false);

          // Redirect to login after delay
          setTimeout(() => {
            router.push('/login');
          }, 3000);
        }
      }
    } catch (err: unknown) {
      logger.error('Registration error', {
        error: err,
        email: formData.email,
        message: err instanceof Error ? err.message : 'Unknown error',
      });
      setError("Une erreur est survenue lors de l'inscription. Veuillez réessayer.");
    } finally {
      setIsLoading(false);
    }
  }, [formData, passwordStrength.score, acceptedTerms, router]);

  // OAuth register
  const handleOAuthRegister = useCallback(async (provider: 'google' | 'github') => {
    try {
      setOauthLoading(provider);
      setError('');

      const { createClient } = await import('@/lib/supabase/client');
      const supabase = createClient();

      const appUrl = process.env.NEXT_PUBLIC_APP_URL || 
        (typeof window !== 'undefined' ? window.location.origin : 'https://app.luneo.app');
      const redirectTo = `${appUrl}/auth/callback?next=/overview`;

      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo,
          queryParams: provider === 'google' ? {
            access_type: 'offline',
            prompt: 'consent',
          } : undefined,
        },
      });

      if (error) {
        setError(`Erreur ${provider}: ${error.message}`);
        setOauthLoading(null);
      }
    } catch (err: unknown) {
      logger.error('OAuth registration error', {
        error: err,
        provider,
        message: err instanceof Error ? err.message : 'Unknown error',
      });
      setError(`Erreur d'inscription ${provider}. Veuillez réessayer.`);
      setOauthLoading(null);
    }
  }, []);

  return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="w-full"
      >
      {/* Header */}
      <div className="text-center mb-6">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-2xl mb-6 shadow-lg shadow-cyan-500/25 lg:hidden"
        >
          <span className="text-white font-bold text-2xl">L</span>
        </motion.div>
        <h1 data-testid="register-title" className="text-2xl sm:text-3xl font-bold text-white mb-2">
          Créer un compte 🚀
        </h1>
        <p className="text-slate-300">
          Commencez gratuitement pendant 14 jours
        </p>
          </div>

          {/* Error Message */}
          {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl flex items-start gap-3"
        >
          <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-300">{error}</p>
        </motion.div>
          )}

          {/* Success Message */}
          {success && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 p-4 bg-green-500/10 border border-green-500/30 rounded-xl flex items-start gap-3"
        >
          <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm text-green-300">{success}</p>
            <p className="text-xs text-green-400/70 mt-1">Redirection vers la connexion...</p>
            </div>
        </motion.div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
        {/* Full Name */}
        <div className="space-y-2">
          <Label htmlFor="fullName" className="text-sm font-medium text-slate-200 block mb-1.5">
            Nom complet <span className="text-red-400">*</span>
              </Label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5 z-10" />
                <Input
                  id="fullName"
                  data-testid="register-name"
                  type="text"
                  placeholder="Jean Dupont"
              className="pl-10 bg-slate-800 border-2 border-slate-600 text-white placeholder:text-slate-400 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 h-12 text-base"
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

        {/* Email */}
        <div className="space-y-2">
          <Label htmlFor="email" className="text-sm font-medium text-slate-200 block mb-1.5">
            Email professionnel <span className="text-red-400">*</span>
              </Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5 z-10" />
                <Input
                  id="email"
                  data-testid="register-email"
                  type="email"
              placeholder="votre@entreprise.com"
              className="pl-10 bg-slate-800 border-2 border-slate-600 text-white placeholder:text-slate-400 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 h-12 text-base"
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

        {/* Company */}
        <div className="space-y-2">
          <Label htmlFor="company" className="text-sm font-medium text-slate-200 block mb-1.5">
            Entreprise <span className="text-slate-400">(optionnel)</span>
              </Label>
          <div className="relative">
            <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5 z-10" />
                <Input
                  id="company"
                  type="text"
                  placeholder="Votre entreprise"
              className="pl-10 bg-slate-800 border-2 border-slate-600 text-white placeholder:text-slate-400 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 h-12 text-base"
                  value={formData.company}
                  onChange={(e) => setFormData({ ...formData, company: e.target.value })}
              disabled={isLoading}
                />
              </div>
            </div>

        {/* Password */}
        <div className="space-y-2">
          <Label htmlFor="password" className="text-sm font-medium text-slate-200 block mb-1.5">
            Mot de passe <span className="text-red-400">*</span>
              </Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5 z-10" />
                <Input
                  id="password"
                  data-testid="register-password"
                  type={showPassword ? 'text' : 'password'}
              placeholder="Créez un mot de passe sécurisé"
              className="pl-10 pr-12 bg-slate-800 border-2 border-slate-600 text-white placeholder:text-slate-400 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 h-12 text-base"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
              disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-200 transition-colors z-10"
              tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
          </div>

          {/* Password Strength Indicator */}
          {formData.password && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="space-y-2"
            >
              {/* Strength bar */}
              <div className="flex items-center gap-2">
                <div className="flex-1 h-1.5 bg-slate-700 rounded-full overflow-hidden flex gap-0.5">
                  {[0, 1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      className={`h-full flex-1 rounded-full transition-colors ${
                        i < passwordStrength.score ? passwordStrength.color : 'bg-slate-700'
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
                  { key: 'length', label: '8 caractères min.' },
                  { key: 'uppercase', label: '1 majuscule' },
                  { key: 'lowercase', label: '1 minuscule' },
                  { key: 'number', label: '1 chiffre' },
                ].map(({ key, label }) => (
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
                    {label}
                  </div>
                ))}
              </div>
            </motion.div>
          )}
            </div>

        {/* Confirm Password */}
        <div className="space-y-2">
          <Label htmlFor="confirmPassword" className="text-sm font-medium text-slate-200 block mb-1.5">
            Confirmer le mot de passe <span className="text-red-400">*</span>
              </Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5 z-10" />
                <Input
                  id="confirmPassword"
                  data-testid="register-confirm-password"
              type={showConfirmPassword ? 'text' : 'password'}
              placeholder="Confirmez votre mot de passe"
              className={`pl-10 pr-12 bg-slate-800 border-2 text-white placeholder:text-slate-400 focus:ring-2 focus:ring-cyan-500/20 h-12 text-base ${
                formData.confirmPassword && !passwordsMatch 
                  ? 'border-red-500 focus:border-red-500' 
                  : 'border-slate-600 focus:border-cyan-500'
              }`}
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  required
              disabled={isLoading}
                />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-200 transition-colors z-10"
              tabIndex={-1}
            >
              {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
              </div>
          {formData.confirmPassword && !passwordsMatch && (
            <p className="text-xs text-red-400">Les mots de passe ne correspondent pas</p>
          )}
          {passwordsMatch && (
            <p className="text-xs text-green-400 flex items-center gap-1">
              <Check className="w-3 h-3" /> Les mots de passe correspondent
            </p>
          )}
            </div>

        {/* Terms acceptance */}
        <div className="flex items-start gap-3 pt-2">
              <input
                id="terms"
                type="checkbox"
            checked={acceptedTerms}
            onChange={(e) => setAcceptedTerms(e.target.checked)}
            className="w-5 h-5 mt-0.5 rounded border-2 border-slate-600 bg-slate-800 text-cyan-500 focus:ring-2 focus:ring-cyan-500/20 focus:ring-offset-0 cursor-pointer"
                required
              />
          <Label htmlFor="terms" className="text-sm text-slate-300 cursor-pointer leading-relaxed flex-1">
            J&apos;accepte les{' '}
            <Link href="/legal/terms" className="text-cyan-400 hover:text-cyan-300 underline font-medium">
              conditions d&apos;utilisation
                </Link>{' '}
                et la{' '}
            <Link href="/legal/privacy" className="text-cyan-400 hover:text-cyan-300 underline font-medium">
                  politique de confidentialité
                </Link>
              </Label>
            </div>

        {/* Submit Button */}
            <Button
              type="submit"
              data-testid="register-submit"
          disabled={isLoading || !isFormValid}
          className="w-full bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white h-12 text-base font-medium shadow-lg shadow-cyan-500/25 disabled:opacity-50 disabled:cursor-not-allowed mt-6"
            >
              {isLoading ? (
                <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Création du compte...
                </>
              ) : (
                <>
              Créer mon compte gratuit
              <ArrowRight className="w-5 h-5 ml-2" />
                </>
              )}
            </Button>
          </form>

          {/* Divider */}
      <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-slate-600" />
              </div>
              <div className="relative flex justify-center text-sm">
          <span className="px-4 bg-slate-900 text-slate-400">ou s&apos;inscrire avec</span>
            </div>
          </div>

          {/* Social Register */}
      <div className="grid grid-cols-2 gap-3">
            <Button
              type="button"
              variant="outline"
              data-testid="register-oauth-google"
              aria-label="S'inscrire avec Google"
          className="bg-slate-800 border-2 border-slate-600 hover:bg-slate-700 hover:border-slate-500 text-white h-12 text-sm sm:text-base"
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
              aria-label="S'inscrire avec GitHub"
          className="bg-slate-800 border-2 border-slate-600 hover:bg-slate-700 hover:border-slate-500 text-white h-12 text-sm sm:text-base"
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

          {/* Sign in link */}
      <div className="mt-6 text-center">
        <p className="text-sm text-slate-400">
              Vous avez déjà un compte ?{' '}
          <Link
            href="/login"
            data-testid="register-switch-login"
            className="text-cyan-400 hover:text-cyan-300 font-medium transition-colors"
          >
                Se connecter
              </Link>
            </p>
          </div>

      {/* Trial info */}
      <div className="mt-6 pt-4 border-t border-slate-800">
        <div className="flex items-center justify-center gap-4 text-xs text-slate-500">
          <div className="flex items-center gap-1">
            <CheckCircle className="w-3 h-3 text-green-400" />
            <span>14 jours gratuits</span>
          </div>
          <div className="flex items-center gap-1">
            <CheckCircle className="w-3 h-3 text-green-400" />
            <span>Sans carte bancaire</span>
          </div>
          <div className="flex items-center gap-1">
            <Shield className="w-3 h-3 text-green-400" />
            <span>RGPD</span>
          </div>
        </div>
      </div>
      </motion.div>
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
