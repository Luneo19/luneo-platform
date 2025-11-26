'use client';

import { useState, useCallback } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, 
  Mail, 
  Loader2, 
  CheckCircle, 
  AlertCircle,
  KeyRound,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  // Email validation
  const isValidEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (!isValidEmail(email)) {
      setError('Veuillez entrer une adresse email valide');
      setLoading(false);
      return;
    }

    try {
      const { createClient } = await import('@/lib/supabase/client');
      const supabase = createClient();

      const appUrl = process.env.NEXT_PUBLIC_APP_URL || 
        (typeof window !== 'undefined' ? window.location.origin : 'https://app.luneo.app');
      
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${appUrl}/reset-password`,
      });

      if (resetError) {
        throw new Error(resetError.message);
      }

      setSent(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  }, [email]);

  if (sent) {
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
          Email envoyé ! ✉️
        </h1>
        
        <p className="text-slate-400 mb-2">
          Si un compte existe avec l&apos;adresse
        </p>
        <p className="text-cyan-400 font-medium mb-4">
          {email}
        </p>
        <p className="text-slate-400 mb-8">
          vous recevrez un lien pour réinitialiser votre mot de passe.
        </p>

        <div className="p-4 bg-slate-800/50 border border-slate-700 rounded-xl mb-6">
          <p className="text-sm text-slate-400">
            💡 <span className="font-medium">Conseil :</span> Vérifiez également votre dossier spam si vous ne trouvez pas l&apos;email.
          </p>
        </div>

        <div className="space-y-3">
          <Button
            onClick={() => {
              setSent(false);
              setEmail('');
            }}
            variant="outline"
            className="w-full bg-slate-800/50 border-slate-700 hover:bg-slate-800 text-white h-11"
          >
            Renvoyer un email
          </Button>
          
          <Link href="/login">
            <Button className="w-full bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white h-11">
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
          Mot de passe oublié ?
        </h1>
        <p className="text-slate-400">
          Entrez votre email et nous vous enverrons un lien de réinitialisation.
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

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="email" className="text-sm font-medium text-slate-300">
            Adresse email
          </Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500 w-5 h-5" />
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="pl-10 bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500 focus:border-cyan-500 focus:ring-cyan-500/20 h-12"
              placeholder="votre@email.com"
              disabled={loading}
            />
            {email && isValidEmail(email) && (
              <CheckCircle className="absolute right-3 top-1/2 transform -translate-y-1/2 text-green-400 w-5 h-5" />
            )}
          </div>
        </div>

        <Button
          type="submit"
          disabled={loading || !email}
          className="w-full bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white h-12 font-medium shadow-lg shadow-cyan-500/25 disabled:opacity-50"
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              Envoi en cours...
            </>
          ) : (
            <>
              <Mail className="w-5 h-5 mr-2" />
              Envoyer le lien de réinitialisation
            </>
          )}
        </Button>
      </form>

      {/* Help text */}
      <div className="mt-8 text-center">
        <p className="text-sm text-slate-500">
          Vous vous souvenez de votre mot de passe ?{' '}
          <Link href="/login" className="text-cyan-400 hover:text-cyan-300 font-medium">
            Se connecter
          </Link>
        </p>
      </div>
    </motion.div>
  );
}
