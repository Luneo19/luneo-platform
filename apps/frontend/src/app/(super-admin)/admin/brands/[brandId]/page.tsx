'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Users, Package, Palette, ShoppingCart, FileText, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useBrandDetail } from '@/hooks/admin/use-brand-detail';

const statStyles: Record<string, { iconBg: string; iconText: string }> = {
  blue: { iconBg: 'bg-blue-500/10', iconText: 'text-blue-400' },
  green: { iconBg: 'bg-green-500/10', iconText: 'text-green-400' },
  purple: { iconBg: 'bg-purple-500/10', iconText: 'text-purple-400' },
  amber: { iconBg: 'bg-amber-500/10', iconText: 'text-amber-400' },
  cyan: { iconBg: 'bg-cyan-500/10', iconText: 'text-cyan-400' },
};

export default function BrandDetailPage() {
  const params = useParams();
  const brandId = typeof params.brandId === 'string' ? params.brandId : null;
  const { brand, isLoading, isError, refresh } = useBrandDetail(brandId);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 text-blue-400 animate-spin" />
      </div>
    );
  }

  if (isError || !brand) {
    return (
      <div className="p-6">
        <Card className="bg-red-500/10 border-red-500/20">
          <CardContent className="p-6 text-center">
            <p className="text-red-400">Marque introuvable</p>
            <Link href="/admin/brands"><Button variant="outline" className="mt-4">Retour</Button></Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const plan = brand.subscriptionPlan || brand.plan || 'free';
  const aiUsagePercent = brand.maxMonthlyGenerations > 0
    ? Math.round((brand.monthlyGenerations / brand.maxMonthlyGenerations) * 100)
    : 0;
  const aiCostPercent = brand.aiCostLimitCents > 0
    ? Math.round((brand.aiCostUsedCents / brand.aiCostLimitCents) * 100)
    : 0;

  const stats = [
    { icon: Users, label: 'Users', value: brand._count.users, color: 'blue' as const },
    { icon: Package, label: 'Produits', value: brand._count.products, color: 'green' as const },
    { icon: Palette, label: 'Designs', value: brand._count.designs, color: 'purple' as const },
    { icon: ShoppingCart, label: 'Commandes', value: brand._count.orders, color: 'amber' as const },
    { icon: FileText, label: 'Factures', value: brand._count.invoices, color: 'cyan' as const },
  ];

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/admin/brands">
          <Button variant="ghost" size="icon" className="text-zinc-400 hover:text-white">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-xl font-bold text-white">
          {brand.name.charAt(0).toUpperCase()}
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-white">{brand.name}</h1>
            <Badge variant="outline" className="bg-blue-500/10 text-blue-400 border-blue-500/20">{plan}</Badge>
            <Badge variant="outline" className="bg-green-500/10 text-green-400 border-green-500/20">{brand.status}</Badge>
          </div>
          <p className="text-sm text-zinc-400 mt-1">{brand.slug} {brand.website ? `• ${brand.website}` : ''}</p>
        </div>
        <Button variant="outline" onClick={() => refresh()} className="border-zinc-700">Rafraîchir</Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {stats.map((stat) => {
          const styles = statStyles[stat.color] || statStyles.blue;
          const Icon = stat.icon;
          return (
            <Card key={stat.label} className="bg-zinc-800/50 border-zinc-700">
              <CardContent className="p-4 flex items-center gap-3">
                <div className={`p-2 rounded-lg ${styles.iconBg}`}>
                  <Icon className={`w-4 h-4 ${styles.iconText}`} />
                </div>
                <div>
                  <p className="text-xs text-zinc-400">{stat.label}</p>
                  <p className="text-lg font-bold text-white">{stat.value}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="bg-zinc-800 border border-zinc-700">
          <TabsTrigger value="overview">Profil</TabsTrigger>
          <TabsTrigger value="team">Équipe ({brand.users.length})</TabsTrigger>
          <TabsTrigger value="usage">Usage AI</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="bg-zinc-800/50 border-zinc-700">
              <CardHeader><CardTitle className="text-white text-sm">Informations</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {[
                  { label: 'Société', value: brand.companyName },
                  { label: 'TVA', value: brand.vatNumber },
                  { label: 'Adresse', value: [brand.address, brand.city, brand.country].filter(Boolean).join(', ') },
                  { label: 'Téléphone', value: brand.phone },
                  { label: 'Créé le', value: new Date(brand.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }) },
                ].map((item) => (
                  <div key={item.label} className="flex justify-between">
                    <span className="text-sm text-zinc-400">{item.label}</span>
                    <span className="text-sm text-white">{item.value || '—'}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
            <Card className="bg-zinc-800/50 border-zinc-700">
              <CardHeader><CardTitle className="text-white text-sm">Abonnement</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {[
                  { label: 'Plan', value: plan },
                  { label: 'Statut', value: brand.subscriptionStatus },
                  { label: 'Stripe Customer', value: brand.stripeCustomerId || '—' },
                  { label: 'Expiration', value: brand.planExpiresAt ? new Date(brand.planExpiresAt).toLocaleDateString('fr-FR') : '—' },
                  { label: 'Trial fin', value: brand.trialEndsAt ? new Date(brand.trialEndsAt).toLocaleDateString('fr-FR') : '—' },
                  { label: 'Max produits', value: String(brand.maxProducts) },
                ].map((item) => (
                  <div key={item.label} className="flex justify-between">
                    <span className="text-sm text-zinc-400">{item.label}</span>
                    <span className="text-sm text-white">{item.value}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="team">
          <Card className="bg-zinc-800/50 border-zinc-700">
            <Table>
              <TableHeader>
                <TableRow className="border-zinc-700 hover:bg-transparent">
                  <TableHead className="text-zinc-400">Membre</TableHead>
                  <TableHead className="text-zinc-400">Rôle</TableHead>
                  <TableHead className="text-zinc-400">Statut</TableHead>
                  <TableHead className="text-zinc-400">Dernière connexion</TableHead>
                  <TableHead className="text-zinc-400">Rejoint le</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {brand.users.map((user) => (
                  <TableRow key={user.id} className="border-zinc-700">
                    <TableCell>
                      <div>
                        <p className="font-medium text-white">{user.firstName} {user.lastName}</p>
                        <p className="text-xs text-zinc-500">{user.email}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">{user.role}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={(user as { isActive?: boolean }).isActive !== false ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'}>
                        {(user as { isActive?: boolean }).isActive !== false ? 'Actif' : 'Inactif'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-zinc-400">
                      {user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleDateString('fr-FR') : '—'}
                    </TableCell>
                    <TableCell className="text-sm text-zinc-400">
                      {(user as { createdAt?: string }).createdAt ? new Date((user as { createdAt: string }).createdAt).toLocaleDateString('fr-FR') : '—'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        <TabsContent value="usage">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="bg-zinc-800/50 border-zinc-700">
              <CardHeader><CardTitle className="text-white text-sm">Générations AI</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between text-sm">
                  <span className="text-zinc-400">Utilisation mensuelle</span>
                  <span className="text-white">{brand.monthlyGenerations} / {brand.maxMonthlyGenerations}</span>
                </div>
                <div className="w-full h-3 bg-zinc-700 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full transition-all ${aiUsagePercent > 80 ? 'bg-red-500' : aiUsagePercent > 50 ? 'bg-yellow-500' : 'bg-blue-500'}`} style={{ width: `${Math.min(aiUsagePercent, 100)}%` }} />
                </div>
                <p className="text-xs text-zinc-500">{aiUsagePercent}% utilisé</p>
              </CardContent>
            </Card>
            <Card className="bg-zinc-800/50 border-zinc-700">
              <CardHeader><CardTitle className="text-white text-sm">Budget AI</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between text-sm">
                  <span className="text-zinc-400">Coût ce mois</span>
                  <span className="text-white">{(brand.aiCostUsedCents / 100).toFixed(2)} CHF / {(brand.aiCostLimitCents / 100).toFixed(2)} CHF</span>
                </div>
                <div className="w-full h-3 bg-zinc-700 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full transition-all ${aiCostPercent > 80 ? 'bg-red-500' : aiCostPercent > 50 ? 'bg-yellow-500' : 'bg-green-500'}`} style={{ width: `${Math.min(aiCostPercent, 100)}%` }} />
                </div>
                <p className="text-xs text-zinc-500">{aiCostPercent}% du budget consommé</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
