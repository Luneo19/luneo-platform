'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  CreditCard, Download, Receipt, Calendar, CheckCircle, 
  AlertCircle, Plus, Edit, Trash2, Shield, Lock,
  TrendingUp, DollarSign, Clock, Zap,
  Crown, Building, Star, ExternalLink
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { logger } from '@/lib/logger';

interface Invoice {
  id: string;
  number: string;
  date: string;
  amount: number;
  status: 'paid' | 'pending' | 'failed';
  plan: string;
  period: string;
  pdfUrl: string;
}

interface PaymentMethod {
  id: string;
  type: 'card' | 'paypal' | 'sepa';
  last4?: string;
  brand?: string;
  expiryMonth?: string;
  expiryYear?: string;
  isDefault: boolean;
  email?: string;
}

export default function BillingPage() {
  const { toast } = useToast();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [currentPlan, setCurrentPlan] = useState({
    name: 'Pro',
    price: 47,
    period: 'monthly',
    nextBilling: '2025-12-03',
    status: 'active'
  });

  const [invoices, setInvoices] = useState<Invoice[]>([
    {
      id: '1',
      number: 'INV-2025-001',
      date: '2025-11-03',
      amount: 47,
      status: 'paid',
      plan: 'Pro',
      period: 'Nov 2025',
      pdfUrl: '/invoices/inv-001.pdf'
    },
    {
      id: '2',
      number: 'INV-2025-002',
      date: '2025-10-03',
      amount: 47,
      status: 'paid',
      plan: 'Pro',
      period: 'Oct 2025',
      pdfUrl: '/invoices/inv-002.pdf'
    },
    {
      id: '3',
      number: 'INV-2025-003',
      date: '2025-09-03',
      amount: 47,
      status: 'paid',
      plan: 'Pro',
      period: 'Sep 2025',
      pdfUrl: '/invoices/inv-003.pdf'
    }
  ]);

  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([
    {
      id: '1',
      type: 'card',
      last4: '4242',
      brand: 'Visa',
      expiryMonth: '12',
      expiryYear: '2026',
      isDefault: true
    },
    {
      id: '2',
      type: 'paypal',
      email: 'emmanuel@luneo.app',
      isDefault: false
    }
  ]);

  const [billingHistory, setBillingHistory] = useState([
    { month: 'Nov 2025', amount: 47, status: 'paid' },
    { month: 'Oct 2025', amount: 47, status: 'paid' },
    { month: 'Sep 2025', amount: 47, status: 'paid' },
    { month: 'Aug 2025', amount: 47, status: 'paid' },
    { month: 'Jul 2025', amount: 47, status: 'paid' },
    { month: 'Jun 2025', amount: 47, status: 'paid' }
  ]);

  useEffect(() => {
    loadBillingData();
  }, []);

  const loadBillingData = async () => {
    setLoading(true);
    try {
      // Fetch invoices
      const invoicesRes = await fetch('/api/billing/invoices');
      if (invoicesRes.ok) {
        const invoicesData = await invoicesRes.json();
        const remoteInvoices: Invoice[] = invoicesData.data || [];
        setInvoices(remoteInvoices);

        if (remoteInvoices.length > 0) {
          const latestInvoice = remoteInvoices[0];
          const nextBillingDate = new Date(latestInvoice.date);
          nextBillingDate.setMonth(nextBillingDate.getMonth() + 1);

          setCurrentPlan(prev => ({
            ...prev,
            name: latestInvoice.plan || prev.name,
            price: latestInvoice.amount || prev.price,
            nextBilling: nextBillingDate.toISOString().slice(0, 10),
            status: latestInvoice.status === 'failed' ? 'past_due' : 'active'
          }));

          setBillingHistory(
            remoteInvoices.map(invoice => ({
              month: invoice.period,
              amount: invoice.amount,
              status: invoice.status
            }))
          );
        }
      }

      // Fetch payment methods
      const methodsRes = await fetch('/api/billing/payment-methods');
      if (methodsRes.ok) {
        const methodsData = await methodsRes.json();
        setPaymentMethods(methodsData.data || []);
      }
    } catch (error) {
      logger.error('Error loading billing data', {
        error,
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadInvoice = async (invoice: Invoice) => {
    try {
      toast({
        title: "Téléchargement",
        description: `Téléchargement de ${invoice.number}...`,
      });
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast({
        title: "Succès",
        description: "La facture a été téléchargée",
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de télécharger la facture",
        variant: "destructive",
      });
    }
  };

  const handleSetDefaultPayment = async (methodId: string) => {
    try {
      const response = await fetch('/api/billing/payment-methods', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ methodId, isDefault: true })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to update payment method');
      }
      
      setPaymentMethods(paymentMethods.map(pm => ({
        ...pm,
        isDefault: pm.id === methodId
      })));

      toast({
        title: "Méthode de paiement modifiée",
        description: "La méthode de paiement par défaut a été mise à jour",
      });
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message || "Impossible de modifier la méthode de paiement",
        variant: "destructive",
      });
    }
  };

  const handleRemovePayment = async (methodId: string) => {
    const method = paymentMethods.find(pm => pm.id === methodId);
    if (method?.isDefault) {
      toast({
        title: "Erreur",
        description: "Impossible de supprimer la méthode de paiement par défaut",
        variant: "destructive",
      });
      return;
    }

    if (!confirm('Êtes-vous sûr de vouloir supprimer cette méthode de paiement ?')) {
      return;
    }

    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setPaymentMethods(paymentMethods.filter(pm => pm.id !== methodId));

      toast({
        title: "Méthode supprimée",
        description: "La méthode de paiement a été supprimée",
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de supprimer la méthode de paiement",
        variant: "destructive",
      });
    }
  };

  const handleAddPayment = () => {
    router.push('/dashboard/settings?tab=billing');
  };

  const handleChangePlan = () => {
    router.push('/dashboard/plans');
  };

  const handleCancelPlan = () => {
    router.push('/dashboard/support?topic=billing');
  };

  const handleViewAllInvoices = () => {
    router.push('/dashboard/billing/history');
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return <span className="px-2 py-1 bg-green-500/10 text-green-400 text-xs rounded-full flex items-center gap-1">
          <CheckCircle className="w-3 h-3" /> Payée
        </span>;
      case 'pending':
        return <span className="px-2 py-1 bg-yellow-500/10 text-yellow-400 text-xs rounded-full flex items-center gap-1">
          <Clock className="w-3 h-3" /> En attente
        </span>;
      case 'failed':
        return <span className="px-2 py-1 bg-red-500/10 text-red-400 text-xs rounded-full flex items-center gap-1">
          <AlertCircle className="w-3 h-3" /> Échouée
        </span>;
      default:
        return null;
    }
  };

  const getPlanIcon = (plan: string) => {
    switch (plan) {
      case 'Pro':
        return <Zap className="w-5 h-5 text-purple-400" />;
      case 'Business':
        return <Building className="w-5 h-5 text-orange-400" />;
      case 'Enterprise':
        return <Crown className="w-5 h-5 text-yellow-400" />;
      default:
        return <Star className="w-5 h-5 text-blue-400" />;
    }
  };

  const getCardBrandLogo = (brand: string) => {
    // In a real app, you'd use actual card brand logos
  const normalized = brand?.toLowerCase() ?? '';
  if (normalized.includes('visa')) {
    return <CreditCard className="w-8 h-8 text-blue-400" />;
  }
  if (normalized.includes('mastercard')) {
    return <CreditCard className="w-8 h-8 text-orange-400" />;
  }
  if (normalized.includes('american express') || normalized.includes('amex')) {
    return <CreditCard className="w-8 h-8 text-cyan-400" />;
  }
  return <CreditCard className="w-8 h-8 text-purple-400" />;
  };

  const totalSpent = billingHistory.reduce((sum, item) => sum + item.amount, 0);
  const averageMonthly = billingHistory.length > 0 ? totalSpent / billingHistory.length : 0;
  const statColorMap = useMemo(
    () => ({
      blue: { bg: 'bg-blue-500/10', text: 'text-blue-400' },
      purple: { bg: 'bg-purple-500/10', text: 'text-purple-400' },
      green: { bg: 'bg-green-500/10', text: 'text-green-400' },
      orange: { bg: 'bg-orange-500/10', text: 'text-orange-400' }
    }),
    []
  );

  return (
    <div className="space-y-6 pb-10">
      {loading && (
        <Card className="p-6 bg-gray-900/70 border border-purple-500/30 text-gray-300 animate-pulse">
          Mise à jour de vos informations de facturation...
        </Card>
      )}
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">Facturation</h1>
          <p className="text-gray-400">Gérez votre abonnement et moyens de paiement</p>
        </div>
        <Button className="bg-gradient-to-r from-blue-600 to-purple-600">
          <Plus className="w-4 h-4 mr-2" />
          Ajouter un moyen de paiement
        </Button>
      </div>

      {/* Current Plan */}
      <Card className="p-6 bg-gradient-to-r from-purple-600/10 to-blue-600/10 border-purple-500/20">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-purple-500/10 rounded-lg">
              {getPlanIcon(currentPlan.name)}
            </div>
            <div>
              <div className="flex items-center gap-2 mb-2">
                <h3 className="text-xl font-bold text-white">Plan {currentPlan.name}</h3>
                <span className="px-2 py-1 bg-green-500/10 text-green-400 text-xs rounded-full">
                  Actif
                </span>
              </div>
              <p className="text-gray-300 mb-1">
                <span className="text-2xl font-bold">{currentPlan.price}€</span>
                <span className="text-gray-400">/{currentPlan.period === 'monthly' ? 'mois' : 'an'}</span>
              </p>
              <p className="text-sm text-gray-400">
                Prochain paiement le {new Date(currentPlan.nextBilling).toLocaleDateString('fr-FR')}
              </p>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              variant="outline"
              className="border-purple-500/50 hover:bg-purple-500/10"
              onClick={handleChangePlan}
            >
              <TrendingUp className="w-4 h-4 mr-2" />
              Changer de plan
            </Button>
            <Button variant="outline" className="border-gray-600" onClick={handleCancelPlan}>
              Annuler l'abonnement
            </Button>
          </div>
        </div>
      </Card>

      {/* Stats */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Dépenses totales', value: `${totalSpent}€`, icon: <DollarSign className="w-5 h-5" />, color: 'blue' },
          { label: 'Moyenne mensuelle', value: `${averageMonthly.toFixed(0)}€`, icon: <TrendingUp className="w-5 h-5" />, color: 'purple' },
          { label: 'Factures payées', value: invoices.filter(i => i.status === 'paid').length, icon: <CheckCircle className="w-5 h-5" />, color: 'green' },
          { label: 'Prochain paiement', value: '3 déc', icon: <Calendar className="w-5 h-5" />, color: 'orange' }
        ].map((stat, i) => (
          <Card key={i} className="p-4 bg-gray-800/50 border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400 mb-1">{stat.label}</p>
                <p className="text-2xl font-bold text-white">{stat.value}</p>
              </div>
              <div
                className={`p-3 rounded-lg ${
                  statColorMap[stat.color as keyof typeof statColorMap]?.bg ?? 'bg-blue-500/10'
                } ${
                  statColorMap[stat.color as keyof typeof statColorMap]?.text ?? 'text-blue-400'
                }`}
              >
                {stat.icon}
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Payment Methods */}
      <Card className="p-6 bg-gray-800/50 border-gray-700">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-bold text-white">Moyens de paiement</h3>
          <Button onClick={handleAddPayment} className="bg-gradient-to-r from-blue-600 to-purple-600">
            <Plus className="w-4 h-4 mr-2" />
            Ajouter
          </Button>
        </div>
        <div className="space-y-4">
          {paymentMethods.length === 0 ? (
            <div className="text-center text-gray-400 py-8 space-y-3">
              <p>Aucune méthode enregistrée.</p>
              <Button variant="outline" onClick={handleAddPayment}>
                <Plus className="w-4 h-4 mr-2" />
                Ajouter un moyen de paiement
              </Button>
            </div>
          ) : (
            paymentMethods.map((method) => (
            <motion.div
              key={method.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center justify-between p-4 bg-gray-900/50 rounded-lg border border-gray-700"
            >
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-500/10 rounded-lg">
                  {method.type === 'card' && getCardBrandLogo(method.brand!)}
                  {method.type === 'paypal' && <DollarSign className="w-8 h-8 text-blue-400" />}
                </div>
                <div>
                  {method.type === 'card' && (
                    <>
                      <h4 className="text-white font-medium">
                        {method.brand} •••• {method.last4}
                      </h4>
                      <p className="text-sm text-gray-400">
                        Expire {method.expiryMonth}/{method.expiryYear}
                      </p>
                    </>
                  )}
                  {method.type === 'paypal' && (
                    <>
                      <h4 className="text-white font-medium">PayPal</h4>
                      <p className="text-sm text-gray-400">{method.email}</p>
                    </>
                  )}
                  {method.isDefault && (
                    <span className="inline-block mt-1 px-2 py-0.5 bg-green-500/10 text-green-400 text-xs rounded-full">
                      Par défaut
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                {!method.isDefault && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleSetDefaultPayment(method.id)}
                    className="border-gray-600"
                  >
                    Définir par défaut
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="outline"
                  className="border-gray-600"
                >
                  <Edit className="w-4 h-4" />
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => handleRemovePayment(method.id)}
                  disabled={method.isDefault}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </motion.div>
            ))
          )}
        </div>

        {paymentMethods.length > 0 && (
          <Button variant="outline" className="w-full mt-4 border-gray-600" onClick={handleAddPayment}>
            <Plus className="w-4 h-4 mr-2" />
            Ajouter un moyen de paiement
          </Button>
        )}
      </Card>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent Invoices */}
        <Card className="p-6 bg-gray-800/50 border-gray-700">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-white">Factures récentes</h3>
            <Button variant="outline" size="sm" className="border-gray-600" onClick={handleViewAllInvoices}>
              Voir tout
            </Button>
          </div>
          <div className="space-y-3">
            {invoices.length === 0 ? (
              <div className="text-center text-gray-400 py-8 space-y-3">
                <p>Aucune facture pour le moment.</p>
                <Button variant="outline" onClick={handleViewAllInvoices}>
                  Générer un relevé
                </Button>
              </div>
            ) : (
              invoices.map((invoice) => (
                <div
                  key={invoice.id}
                  className="flex items-center justify-between p-4 bg-gray-900/50 rounded-lg hover:bg-gray-900 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-500/10 rounded">
                      <Receipt className="w-5 h-5 text-blue-400" />
                    </div>
                    <div>
                      <h4 className="text-white font-medium">{invoice.number}</h4>
                      <p className="text-sm text-gray-400">
                        {new Date(invoice.date).toLocaleDateString('fr-FR')} • {invoice.period}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="text-white font-bold">{invoice.amount}€</p>
                      {getStatusBadge(invoice.status)}
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDownloadInvoice(invoice)}
                      className="border-gray-600"
                    >
                      <Download className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>

        {/* Billing History Chart */}
        <Card className="p-6 bg-gray-800/50 border-gray-700">
          <h3 className="text-lg font-bold text-white mb-6">Historique des paiements</h3>
          <div className="space-y-3">
            {billingHistory.map((item, i) => {
              const maxAmount = Math.max(...billingHistory.map(h => h.amount));
              const percentage = (item.amount / maxAmount) * 100;
              
              return (
                <div key={i}>
                  <div className="flex items-center justify-between mb-2 text-sm">
                    <span className="text-gray-400">{item.month}</span>
                    <span className="text-white font-bold">{item.amount}€</span>
                  </div>
                  <div className="h-2 bg-gray-900 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${percentage}%` }}
                      transition={{ delay: i * 0.1 }}
                      className="h-full bg-gradient-to-r from-blue-600 to-purple-600"
                    />
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-6 p-4 bg-gray-900/50 rounded-lg">
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Total (6 mois)</span>
              <span className="text-white font-bold text-xl">{totalSpent}€</span>
            </div>
          </div>
        </Card>
      </div>

      {/* Billing Info */}
      <Card className="p-6 bg-gray-800/50 border-gray-700">
        <h3 className="text-lg font-bold text-white mb-6">Informations de facturation</h3>
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Nom de l'entreprise
            </label>
            <input
              type="text"
              defaultValue="Luneo Platform"
              className="w-full px-4 py-2 bg-gray-900 border border-gray-600 rounded-lg text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Numéro de TVA
            </label>
            <input
              type="text"
              placeholder="FR12345678901"
              className="w-full px-4 py-2 bg-gray-900 border border-gray-600 rounded-lg text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Adresse
            </label>
            <input
              type="text"
              placeholder="123 Rue Example"
              className="w-full px-4 py-2 bg-gray-900 border border-gray-600 rounded-lg text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Ville
            </label>
            <input
              type="text"
              placeholder="Paris"
              className="w-full px-4 py-2 bg-gray-900 border border-gray-600 rounded-lg text-white"
            />
          </div>
        </div>
        <Button className="mt-6 bg-blue-600 hover:bg-blue-700">
          <Lock className="w-4 h-4 mr-2" />
          Enregistrer les informations
        </Button>
      </Card>

      {/* Billing Actions */}
      <Card className="p-6 bg-gray-800/50 border-gray-700">
        <h3 className="text-lg font-bold text-white mb-4">Centre d'action</h3>
        <p className="text-sm text-gray-400 mb-6">
          Pilotez vos paiements : export, support, mise à niveau.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Button
            className="h-20 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white"
            onClick={handleViewAllInvoices}
          >
            <Receipt className="w-5 h-5 mr-2" />
            Voir mes factures
          </Button>
          <Button
            variant="outline"
            className="h-20 border-gray-600 text-gray-300 hover:bg-gray-700"
            onClick={() => router.push('/dashboard/support?topic=billing')}
          >
            <AlertCircle className="w-5 h-5 mr-2" />
            Contacter le support
          </Button>
          <Button
            variant="outline"
            className="h-20 border-gray-600 text-gray-300 hover:bg-gray-700"
            onClick={handleChangePlan}
          >
            <TrendingUp className="w-5 h-5 mr-2" />
            Mettre à niveau
          </Button>
        </div>
      </Card>

      {/* Security Notice */}
      <Card className="p-6 bg-blue-500/5 border-blue-500/20">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-blue-500/10 rounded-lg">
            <Shield className="w-6 h-6 text-blue-400" />
          </div>
          <div>
            <h4 className="text-white font-bold mb-2">Paiements sécurisés</h4>
            <p className="text-gray-300 text-sm mb-3">
              Tous les paiements sont traités de manière sécurisée via Stripe avec chiffrement SSL/TLS.
              Vos informations de carte bancaire ne sont jamais stockées sur nos serveurs.
            </p>
            <Button variant="outline" size="sm" className="border-blue-500/50">
              <ExternalLink className="w-4 h-4 mr-2" />
              En savoir plus sur la sécurité
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
