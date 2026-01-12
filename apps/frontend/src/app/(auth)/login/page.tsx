'use client';

import React, { useState, useCallback } from 'react';
import { LazyMotionDiv as motion } from '@/lib/performance/dynamic-motion';
import { FadeIn, SlideUp } from '@/components/animations';
import { 
  Eye, 
  EyeOff, 
  Mail, 
  Lock, 
  ArrowRight, 
  Loader2,
  AlertCircle,
  CheckCircle,
  Shield,
  Fingerprint,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { logger } from '@/lib/logger';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { TwoFactorForm } from '@/components/auth/TwoFactorForm';
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

function LoginPageContent() {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState<'google' | 'github' | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [requires2FA, setRequires2FA] = useState(false);
  const [tempToken, setTempToken] = useState('');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const router = useRouter();

  // Email validation
  const isValidEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  // Login with email/password
  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccess('');

    // Validation
    if (!isValidEmail(formData.email)) {
      setError('Veuillez entrer une adresse email valide');
      setIsLoading(false);
      return;
    }

    if (formData.password.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères');
      setIsLoading(false);
      return;
    }

    try {
      const { endpoints } = await import('@/lib/api/client');
      
      const response = await endpoints.auth.login({
        email: formData.email,
        password: formData.password,
      });

      // Si 2FA requis
      if (response.requires2FA && response.tempToken) {
        setRequires2FA(true);
        setTempToken(response.tempToken);
        setSuccess('Veuillez entrer votre code 2FA');
        return;
      }

      if (response.accessToken && response.user) {
        // Store token for API calls
        // Tokens are now in httpOnly cookies (set by backend)
        // No need to store in localStorage for security
        // Cookies are automatically sent with each request via withCredentials: true
        if (rememberMe) {
          localStorage.setItem('rememberMe', 'true'); // Keep rememberMe preference
        }
        if (response.user) {
          localStorage.setItem('user', JSON.stringify(response.user)); // Keep user data for UI
        }
        
        setSuccess('Connexion réussie ! Redirection...');
        
        // Redirect to overview
        setTimeout(() => {
          router.push('/overview');
          router.refresh();
        }, 500);
      } else {
        setError('Réponse invalide du serveur');
      }
    } catch (err: unknown) {
      logger.error('Login error', {
        error: err,
        email: formData.email,
        message: err instanceof Error ? err.message : 'Unknown error',
      });
      
      // Handle specific error messages
      if (err instanceof Error) {
        if (err.message.includes('Invalid credentials') || err.message.includes('401')) {
          setError('Email ou mot de passe incorrect');
        } else if (err.message.includes('Email not confirmed')) {
          setError("Veuillez confirmer votre email avant de vous connecter. Vérifiez votre boîte de réception.");
        } else {
          setError(err.message);
        }
      } else {
        setError('Une erreur est survenue. Veuillez réessayer.');
      }
    } finally {
      setIsLoading(false);
    }
  }, [formData, rememberMe, router]);

  // OAuth login - ✅ Migré vers NestJS backend
  const handleOAuthLogin = useCallback(async (provider: 'google' | 'github') => {
    try {
      setOauthLoading(provider);
      setError('');
      
      // Redirect to backend OAuth endpoint
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const oauthUrl = `${apiUrl}/api/v1/auth/${provider}`;
      
      // Redirect to backend OAuth
      window.location.href = oauthUrl;
    } catch (err: unknown) {
      logger.error('OAuth error', {
        error: err,
        provider,
        message: err instanceof Error ? err.message : 'Unknown error',
      });
      setError(`Erreur de connexion ${provider}. Veuillez réessayer.`);
      setOauthLoading(null);
    }
  }, []);

  return (
      <motion
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="w-full"
      >
      {/* Header */}
          <div className="text-center mb-8">
        <motion
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-2xl mb-6 shadow-lg shadow-cyan-500/25 lg:hidden"
        >
          <span className="text-white font-bold text-2xl">L</span>
        </motion>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2" data-testid="login-title">
          Bon retour ! 👋
            </h1>
        <p className="text-gray-600" data-testid="login-subtitle">
          Connectez-vous à votre espace Luneo
            </p>
          </div>

          {/* Error Message */}
          {error && (
        <FadeIn>
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl flex items-start gap-3" data-testid="login-error">
            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-300">{error}</p>
          </div>
        </FadeIn>
      )}

      {/* Success Message */}
      {success && (
        <FadeIn>
          <div className="mb-6 p-4 bg-green-500/10 border border-green-500/30 rounded-xl flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-green-300">{success}</p>
          </div>
        </FadeIn>
          )}

          {/* 2FA Form */}
      {requires2FA ? (
        <TwoFactorForm
          tempToken={tempToken}
          email={formData.email}
          onSuccess={() => {
            setSuccess('Connexion réussie ! Redirection...');
            setTimeout(() => {
              router.push('/overview');
              router.refresh();
            }, 500);
          }}
          onError={(error) => setError(error)}
        />
      ) : (
        <>
        <form onSubmit={handleSubmit} className="space-y-5">
        {/* Email */}
        <SlideUp delay={0.4}>
        <div className="space-y-2">
          <Label htmlFor="email" className="text-sm font-medium text-gray-700">
            Adresse email
              </Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input
                  id="email"
                  type="email"
                  placeholder="votre@email.com"
              className="pl-10 bg-white border-gray-200 text-gray-900 placeholder:text-gray-400 focus:border-indigo-500 focus:ring-indigo-500/20 h-12"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
              disabled={isLoading}
                  data-testid="login-email"
                />
            {formData.email && isValidEmail(formData.email) && (
              <CheckCircle className="absolute right-3 top-1/2 transform -translate-y-1/2 text-green-400 w-5 h-5" />
            )}
              </div>
            </div>
        </SlideUp>

        {/* Password */}
        <SlideUp delay={0.5}>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password" className="text-sm font-medium text-gray-700">
                Mot de passe
              </Label>
            <Link 
              href="/forgot-password" 
              className="text-sm text-cyan-400 hover:text-cyan-300 transition-colors"
              tabIndex={-1}
            >
              Mot de passe oublié ?
            </Link>
          </div>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
              className="pl-10 pr-12 bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500 focus:border-cyan-500 focus:ring-cyan-500/20 h-12"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
              disabled={isLoading}
                  data-testid="login-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
              tabIndex={-1}
                  data-testid="login-toggle-password"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>
        </SlideUp>

        {/* Remember me */}
        <SlideUp delay={0.6}>
            <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
                <input
                  id="remember"
                  type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="w-4 h-4 rounded border-gray-300 bg-white text-indigo-600 focus:ring-indigo-500/20 focus:ring-offset-0"
                  data-testid="login-remember"
                />
            <Label htmlFor="remember" className="text-sm text-gray-600 cursor-pointer">
              Rester connecté
                </Label>
              </div>
          <div className="flex items-center gap-1 text-xs text-gray-500">
            <Shield className="w-3 h-3" />
            <span>Connexion sécurisée</span>
          </div>
            </div>
        </SlideUp>

        {/* Submit Button */}
        <SlideUp delay={0.7}>
            <Button
              type="submit"
          disabled={isLoading || !formData.email || !formData.password}
          className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white h-12 text-base font-medium shadow-lg shadow-indigo-500/25 disabled:opacity-50 disabled:cursor-not-allowed"
              data-testid="login-submit"
            >
              {isLoading ? (
                <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Connexion...
                </>
              ) : (
                <>
                  Se connecter
              <ArrowRight className="w-5 h-5 ml-2" />
                </>
              )}
            </Button>
        </SlideUp>
          </form>

          {/* Divider */}
        <FadeIn delay={0.8}>
      <div className="relative my-8">
              <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-slate-700" />
              </div>
              <div className="relative flex justify-center text-sm">
          <span className="px-4 bg-slate-900 text-slate-500">ou continuer avec</span>
            </div>
          </div>
        </FadeIn>

          {/* Social Login */}
        <SlideUp delay={0.9}>
      <div className="grid grid-cols-2 gap-3">
            <Button
              type="button"
              variant="outline"
          className="bg-slate-800/50 border-slate-700 hover:bg-slate-800 hover:border-slate-600 text-white h-12"
              onClick={() => handleOAuthLogin('google')}
          disabled={isLoading || oauthLoading !== null}
            >
          {oauthLoading === 'google' ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <>
              <GoogleIcon />
              <span className="ml-2">Google</span>
            </>
          )}
            </Button>

            <Button
              type="button"
              variant="outline"
          className="bg-slate-800/50 border-slate-700 hover:bg-slate-800 hover:border-slate-600 text-white h-12"
              onClick={() => handleOAuthLogin('github')}
          disabled={isLoading || oauthLoading !== null}
            >
          {oauthLoading === 'github' ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <>
              <GitHubIcon />
              <span className="ml-2">GitHub</span>
            </>
          )}
            </Button>
          </div>
        </SlideUp>

          {/* Sign up link */}
        <FadeIn delay={1.0}>
      <div className="mt-8 text-center">
        <p className="text-sm text-slate-400">
              Pas encore de compte ?{' '}
              <Link
                href="/register"
            className="text-cyan-400 hover:text-cyan-300 font-medium transition-colors"
                data-testid="login-switch-register"
              >
            Créer un compte gratuitement
              </Link>
            </p>
      </div>
        </FadeIn>

      {/* Security indicators */}
        <FadeIn delay={1.1}>
      <div className="mt-8 pt-6 border-t border-slate-800">
        <div className="flex items-center justify-center gap-6 text-xs text-slate-500">
          <div className="flex items-center gap-1">
            <Shield className="w-3 h-3" />
            <span>SSL/TLS</span>
          </div>
          <div className="flex items-center gap-1">
            <Fingerprint className="w-3 h-3" />
            <span>2FA disponible</span>
          </div>
          <div className="flex items-center gap-1">
            <Lock className="w-3 h-3" />
            <span>RGPD</span>
          </div>
        </div>
      </div>
        </FadeIn>
        </>
      )}
      </motion>
  );
}

const LoginPageContentMemo = memo(LoginPageContent);

export default function LoginPage() {
  return (
    <ErrorBoundary componentName="LoginPage">
      <LoginPageContentMemo />
    </ErrorBoundary>
  );
}
