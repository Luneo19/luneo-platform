'use client';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { AlertCircle, Loader2, Zap } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

interface CreditsDisplayProps {
  userId: string;
  inline?: boolean;
  showBuyButton?: boolean;
  className?: string;
}

interface CreditsData {
  balance: number;
  purchased: number;
  used: number;
}

export function CreditsDisplay({ 
  userId, 
  inline = false, 
  showBuyButton = true,
  className 
}: CreditsDisplayProps) {
  const [credits, setCredits] = useState<CreditsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const fetchCredits = async () => {
    try {
      setError(null);
      const res = await fetch('/api/credits/balance');
      if (!res.ok) {
        throw new Error('Failed to fetch credits');
      }
      const data = await res.json();
      setCredits(data);
    } catch (err) {
      logger.error('Failed to fetch credits', err instanceof Error ? err : new Error(String(err)), {
        component: 'CreditsDisplay',
        userId,
      });
      setError('Erreur de chargement');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!userId) return;
    
    fetchCredits();
    
    // Refresh every 30s
    const interval = setInterval(fetchCredits, 30000);
    return () => clearInterval(interval);
  }, [userId]);

  if (loading || credits === null) {
    return (
      <div className={cn('flex items-center gap-2 text-sm text-muted-foreground', className)}>
        <Loader2 className="w-4 h-4 animate-spin" />
        <span>...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className={cn('flex items-center gap-2 text-sm text-destructive', className)}>
        <AlertCircle className="w-4 h-4" />
        <span>{error}</span>
      </div>
    );
  }

  const { balance } = credits;
  const isLow = balance < 20;
  const isCritical = balance < 5;

  if (inline) {
    return (
      <div className={cn('flex items-center gap-2', className)}>
        <Zap 
          className={cn(
            'w-4 h-4',
            isCritical ? 'text-red-500' : isLow ? 'text-orange-500' : 'text-yellow-500'
          )} 
        />
        <span className="text-sm font-medium">{balance} crédits</span>
        {isLow && showBuyButton && (
          <Button 
            size="sm" 
            variant="outline" 
            onClick={() => router.push('/dashboard/credits')}
            className="h-7 text-xs"
          >
            Recharger
          </Button>
        )}
      </div>
    );
  }

  return (
    <div 
      className={cn(
        'rounded-lg border p-4 transition-colors',
        isCritical 
          ? 'bg-red-50 border-red-200 dark:bg-red-950/20 dark:border-red-800' 
          : isLow 
          ? 'bg-orange-50 border-orange-200 dark:bg-orange-950/20 dark:border-orange-800' 
          : 'bg-card',
        className
      )}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div 
            className={cn(
              'p-2 rounded-full',
              isCritical 
                ? 'bg-red-100 dark:bg-red-900/30' 
                : isLow 
                ? 'bg-orange-100 dark:bg-orange-900/30' 
                : 'bg-yellow-100 dark:bg-yellow-900/30'
            )}
          >
            <Zap 
              className={cn(
                'w-5 h-5',
                isCritical 
                  ? 'text-red-600 dark:text-red-400' 
                  : isLow 
                  ? 'text-orange-600 dark:text-orange-400' 
                  : 'text-yellow-600 dark:text-yellow-400'
              )} 
            />
          </div>
          <div>
            <p className="text-2xl font-bold">{balance}</p>
            <p className="text-sm text-muted-foreground">Crédits IA restants</p>
          </div>
        </div>
        
        {isLow && showBuyButton && (
          <Button 
            onClick={() => router.push('/dashboard/credits')}
            variant={isCritical ? 'destructive' : 'default'}
          >
            <Zap className="w-4 h-4 mr-2" />
            Recharger
          </Button>
        )}
      </div>
      
      {isCritical && (
        <div className="mt-3 flex items-start gap-2 text-sm text-red-700 dark:text-red-400">
          <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <p>
            Crédits presque épuisés! Rechargez maintenant pour continuer à utiliser l'IA.
          </p>
        </div>
      )}
      
      {isLow && !isCritical && (
        <div className="mt-3 text-sm text-orange-700 dark:text-orange-400">
          <p>Pensez à recharger vos crédits pour éviter toute interruption.</p>
        </div>
      )}
    </div>
  );
}




interface CreditsDisplayProps {
  userId: string;
  inline?: boolean;
  showBuyButton?: boolean;
  className?: string;
}


