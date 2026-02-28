'use client';

import React, { useState, useCallback } from 'react';
import { Loader2, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { logger } from '@/lib/logger';
import { endpoints } from '@/lib/api/client';

interface TwoFactorFormProps {
  tempToken: string;
  email: string;
  onSuccess: () => void;
  onError: (error: string) => void;
}

export function TwoFactorForm({ tempToken, email, onSuccess, onError }: TwoFactorFormProps) {
  const [token, setToken] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (token.length !== 6) {
      onError('Veuillez entrer un code à 6 chiffres');
      return;
    }

    try {
      setIsLoading(true);
      const response = await endpoints.auth.loginWith2FA(tempToken, token);

      if (response.user) {
        localStorage.setItem('user', JSON.stringify(response.user));
        onSuccess();
      } else {
        onError('Réponse invalide du serveur');
      }
    } catch (err: unknown) {
      logger.error('2FA login error', {
        error: err,
        email,
        message: err instanceof Error ? err.message : 'Unknown error',
      });

      if (err instanceof Error) {
        if (err.message.includes('Invalid') || err.message.includes('401')) {
          onError('Code 2FA invalide. Veuillez réessayer.');
        } else {
          onError(err.message);
        }
      } else {
        onError('Une erreur est survenue. Veuillez réessayer.');
      }
    } finally {
      setIsLoading(false);
    }
  }, [token, tempToken, email, onSuccess, onError]);

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="text-center mb-6">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-cyan-500/10 rounded-full mb-4">
          <Shield className="w-8 h-8 text-cyan-400" />
        </div>
        <h2 className="text-xl font-semibold text-white mb-2">Vérification 2FA</h2>
        <p className="text-slate-400 text-sm">
          Entrez le code à 6 chiffres depuis votre application d'authentification
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="2fa-token" className="text-slate-300">
          Code d'authentification
        </Label>
        <Input
          id="2fa-token"
          type="text"
          maxLength={6}
          value={token}
          onChange={(e) => setToken(e.target.value.replace(/\D/g, ''))}
          placeholder="123456"
          className="bg-slate-800/50 border-slate-700 text-white text-center text-2xl tracking-widest h-14"
          autoFocus
          disabled={isLoading}
        />
      </div>

      <Button
        type="submit"
        disabled={isLoading || token.length !== 6}
        className="w-full bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white h-12"
      >
        {isLoading ? (
          <>
            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
            Vérification...
          </>
        ) : (
          'Vérifier'
        )}
      </Button>

      <p className="text-xs text-slate-500 text-center">
        Vous pouvez également utiliser un code de backup si vous n'avez pas accès à votre application d'authentification
      </p>
    </form>
  );
}
