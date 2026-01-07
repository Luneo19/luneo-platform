/**
 * Header de la page Seller Dashboard
 */

'use client';

import { Store, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { SellerStatus } from '../types';

interface SellerHeaderProps {
  sellerStatus: SellerStatus | null;
  onConnectStripe: () => void;
  isConnecting: boolean;
}

export function SellerHeader({
  sellerStatus,
  onConnectStripe,
  isConnecting,
}: SellerHeaderProps) {
  const isActive = sellerStatus?.status === 'active' && sellerStatus?.chargesEnabled;

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-white flex items-center gap-3">
          <Store className="w-8 h-8 text-green-400" />
          Seller Dashboard
        </h1>
        <p className="text-gray-400 mt-1">
          Gérez vos ventes, produits et paiements
        </p>
      </div>
      <div className="flex items-center gap-3">
        {sellerStatus && (
          <Badge
            className={
              isActive
                ? 'bg-green-500 text-white'
                : sellerStatus.status === 'pending'
                  ? 'bg-yellow-500 text-white'
                  : 'bg-gray-500 text-white'
            }
          >
            {isActive ? (
              <>
                <CheckCircle2 className="w-3 h-3 mr-1" />
                Actif
              </>
            ) : sellerStatus.status === 'pending' ? (
              <>
                <AlertCircle className="w-3 h-3 mr-1" />
                En attente
              </>
            ) : (
              'Inactif'
            )}
          </Badge>
        )}
        {!isActive && (
          <Button
            onClick={onConnectStripe}
            disabled={isConnecting}
            className="bg-green-600 hover:bg-green-700"
          >
            {isConnecting ? 'Connexion...' : 'Activer le compte vendeur'}
          </Button>
        )}
      </div>
    </div>
  );
}


