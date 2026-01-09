/**
 * Section de gestion des méthodes de paiement
 */

'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CreditCard, Plus, Trash2 } from 'lucide-react';
import { usePaymentMethods } from '../hooks/usePaymentMethods';

export function PaymentMethodsSection() {
  const { paymentMethods, isLoading, addPaymentMethod, deletePaymentMethod } = usePaymentMethods();

  if (isLoading) {
    return (
      <Card className="bg-gray-800/50 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white">Méthodes de paiement</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-400">Chargement...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gray-800/50 border-gray-700">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-white flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-cyan-400" />
              Méthodes de paiement
            </CardTitle>
            <CardDescription className="text-gray-400 mt-1">
              Gérez vos cartes de crédit et méthodes de paiement
            </CardDescription>
          </div>
          <Button onClick={() => addPaymentMethod()} className="bg-cyan-600 hover:bg-cyan-700">
            <Plus className="w-4 h-4 mr-2" />
            Ajouter une carte
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {paymentMethods.length === 0 ? (
          <p className="text-gray-400">Aucune méthode de paiement enregistrée</p>
        ) : (
          <div className="space-y-3">
            {paymentMethods.map((method) => (
              <div
                key={method.id}
                className="flex items-center justify-between p-4 bg-gray-900/50 rounded-lg border border-gray-700"
              >
                <div className="flex items-center gap-4">
                  <CreditCard className="w-5 h-5 text-cyan-400" />
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-white font-medium">
                        {method.card.brand.toUpperCase()} •••• {method.card.last4}
                      </p>
                      {method.isDefault && (
                        <span className="text-xs bg-cyan-500/20 text-cyan-400 px-2 py-1 rounded">
                          Par défaut
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-400">
                      Expire {String(method.card.expMonth).padStart(2, '0')}/{method.card.expYear}
                    </p>
                  </div>
                </div>
                {!method.isDefault && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deletePaymentMethod(method.id)}
                    className="text-red-400 hover:text-red-300"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}



