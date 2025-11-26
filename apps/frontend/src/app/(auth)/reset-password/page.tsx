'use client';

import { Suspense, useEffect, useState, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
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
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { logger } from '@/lib/logger';

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

  const labels = ['Très faible', 'Faible', 'Moyen', 'Fort'];
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

  // Password strength
  const passwordStrength = useMemo(() => 
    checkPasswordStrength(password), 
    [password]
  );

  // Check if passwords match
  const passwordsMatch = useMemo(() => 
    password === confirmPassword && confirmPassword.length > 0,
    [password, confirmPassword]
  );

  // Form validation
  const isFormValid = useMemo(() => 
    passwordStrength.score >= 3 && passwordsMatch,
    [passwordStrength.score, passwordsMatch]
  );

  useEffect(() => {
    let isMounted = true;
    
    const init = async () => {
      try {
        const { createClient } = await import('@/lib/supabase/client');
        const supabase = createClient();
        
        const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(window.location.href);
        
        if (exchangeError) {
          throw new Error(exchangeError.message);
        }
        
        if (isMounted) {
          setIsReady(true);
        }
      } catch (err) {
        logger.error('Token validation error', {
          error: err,
          message: err instanceof Error ? err.message : 'Unknown error',
        });
        if (isMounted) {
          setError('Le lien de réinitialisation est invalide ou a expiré. Veuillez demander un nouveau lien.');
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

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (passwordStrength.score < 3) {
      setError('Veuillez choisir un mot de passe plus sécurisé');
      setLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas');
      setLoading(false);
      return;
    }

    try {
      const { createClient } = await import('@/lib/supabase/client');
      const supabase = createClient();

      const { error: passwordError } = await supabase.auth.updateUser({ password });

      if (passwordError) {
        throw new Error(passwordError.message);
      }

      setSuccess(true);

      setTimeout(() => {
        router.push('/login');
      }, 3000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  }, [password, confirmPassword, passwordStrength.score, router]);

  // Success state
  if (success) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="text-center"
      >
        <div className="inline-flex items-center justify-center w-20 h-20 bg-green-500/10 rounded-full mb-6">
          <CheckCircle className="w-10 h-10 text-green-400" />
              </div>
              
        <h1 className="text-2xl font-bold text-white mb-3">
          Mot de passe modifié ! 🎉
              </h1>
              
        <p className="text-slate-400 mb-6">
          Votre mot de passe a été réinitialisé avec succès.
          <br />
          Vous allez être redirigé vers la connexion...
              </p>

        <Link href="/login">
          <Button className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white h-11 px-6">
                Se connecter maintenant
          </Button>
              </Link>
      </motion.div>
    );
  }

  // Error state (invalid link)
  if (!isInitializing && !isReady && error) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="text-center"
      >
        <div className="inline-flex items-center justify-center w-20 h-20 bg-red-500/10 rounded-full mb-6">
          <AlertCircle className="w-10 h-10 text-red-400" />
            </div>
        
        <h1 className="text-2xl font-bold text-white mb-3">
          Lien expiré
        </h1>
        
        <p className="text-slate-400 mb-6">
          {error}
        </p>

        <div className="space-y-3">
          <Link href="/forgot-password">
            <Button className="w-full bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white h-11">
              Demander un nouveau lien
            </Button>
          </Link>
          
          <Link href="/login">
            <Button 
              variant="outline" 
              className="w-full bg-slate-800/50 border-slate-700 hover:bg-slate-800 text-white h-11"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Retour à la connexion
            </Button>
          </Link>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      {/* Back Link */}
          <Link
            href="/login"
        className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
        Retour à la connexion
          </Link>

          {/* Header */}
          <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-cyan-500/10 rounded-2xl mb-6">
          <KeyRound className="w-8 h-8 text-cyan-400" />
        </div>
        <h1 className="text-2xl font-bold text-white mb-2">
              Nouveau mot de passe
            </h1>
        <p className="text-slate-400">
          Choisissez un mot de passe sécurisé pour votre compte.
            </p>
          </div>

      {/* Error Message */}
      {error && isReady && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl flex items-start gap-3"
        >
          <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-300">{error}</p>
        </motion.div>
            )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* New Password */}
            <div className="space-y-2">
          <Label htmlFor="password" className="text-sm font-medium text-slate-300">
                Nouveau mot de passe
          </Label>
              <div className="relative">
            <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500 w-5 h-5" />
            <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
              placeholder="Créez un mot de passe sécurisé"
              className="pl-10 pr-12 bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500 focus:border-cyan-500 focus:ring-cyan-500/20 h-12"
              disabled={loading || !isReady}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
              tabIndex={-1}
                >
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
          </div>

          {/* Password Strength Indicator */}
          {password && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="space-y-2"
            >
              <div className="flex items-center gap-2">
                <div className="flex-1 h-1.5 bg-slate-700 rounded-full overflow-hidden flex gap-0.5">
                  {[0, 1, 2, 3].map((i) => (
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
          <Label htmlFor="confirmPassword" className="text-sm font-medium text-slate-300">
                Confirmer le mot de passe
          </Label>
              <div className="relative">
            <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500 w-5 h-5" />
            <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  placeholder="Confirmez votre mot de passe"
              className={`pl-10 pr-12 bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500 focus:border-cyan-500 focus:ring-cyan-500/20 h-12 ${
                confirmPassword && !passwordsMatch ? 'border-red-500/50' : ''
              }`}
              disabled={loading || !isReady}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
              tabIndex={-1}
                >
              {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
          {confirmPassword && !passwordsMatch && (
            <p className="text-xs text-red-400">Les mots de passe ne correspondent pas</p>
          )}
          {passwordsMatch && (
            <p className="text-xs text-green-400 flex items-center gap-1">
              <Check className="w-3 h-3" /> Les mots de passe correspondent
            </p>
          )}
            </div>

        {/* Submit Button */}
        <Button
              type="submit"
          disabled={loading || !isReady || !isFormValid}
          className="w-full bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white h-12 font-medium shadow-lg shadow-cyan-500/25 disabled:opacity-50 disabled:cursor-not-allowed mt-6"
            >
              {loading ? (
                <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Réinitialisation...
                </>
              ) : (
                'Réinitialiser mon mot de passe'
              )}
        </Button>
          </form>
    </motion.div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-col items-center justify-center min-h-[400px]">
          <Loader2 className="w-8 h-8 text-cyan-400 animate-spin mb-4" />
          <p className="text-slate-400">Vérification du lien...</p>
        </div>
      }
    >
      <ResetPasswordPageContent />
    </Suspense>
  );
}
