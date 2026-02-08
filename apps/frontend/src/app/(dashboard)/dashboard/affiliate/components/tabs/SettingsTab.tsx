'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { formatPrice } from '@/lib/utils/formatters';
import { Award, CheckCircle, Lock, Save, Trophy } from 'lucide-react';
import { COMMISSION_RATE } from '../constants';
import type { AffiliateStats } from '../types';

interface SettingsTabProps {
  stats: AffiliateStats;
  minPayoutThreshold: number;
}

export function SettingsTab({ stats, minPayoutThreshold }: SettingsTabProps) {
  const tiers = [
    { level: 'Bronze', min: 0, max: 10, icon: '🥉', unlocked: true },
    { level: 'Silver', min: 10, max: 50, icon: '🥈', unlocked: stats.totalConversions >= 10 },
    { level: 'Gold', min: 50, max: 100, icon: '🥇', unlocked: stats.totalConversions >= 50 },
    { level: 'Platinum', min: 100, max: 500, icon: '💎', unlocked: stats.totalConversions >= 100 },
    { level: 'Diamond', min: 500, max: Infinity, icon: '👑', unlocked: stats.totalConversions >= 500 },
  ];
  const achievements = [
    { name: 'Premier pas', description: 'Obtenez votre première conversion', icon: '🎯', unlocked: stats.totalConversions >= 1 },
    { name: 'Débutant', description: '10 conversions', icon: '🌟', unlocked: stats.totalConversions >= 10 },
    { name: 'Expert', description: '50 conversions', icon: '⭐', unlocked: stats.totalConversions >= 50 },
    { name: 'Maître', description: '100 conversions', icon: '🔥', unlocked: stats.totalConversions >= 100 },
    { name: 'Légende', description: '500 conversions', icon: '👑', unlocked: stats.totalConversions >= 500 },
    { name: 'Millionnaire', description: '€10,000 en commissions', icon: '💰', unlocked: stats.totalCommissions >= 10000 },
  ];

  return (
    <div className="space-y-6">
      <div className="grid md:grid-cols-2 gap-6">
        <Card className="bg-gray-50 border-gray-200">
          <CardHeader>
            <CardTitle className="text-gray-900">Paramètres du programme</CardTitle>
            <CardDescription className="text-gray-600">Configurez vos préférences d&apos;affiliation</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <Label className="text-gray-700 mb-2 block">Taux de commission</Label>
              <div className="p-4 bg-gray-100 rounded-lg">
                <p className="text-2xl font-bold text-purple-400">{COMMISSION_RATE}%</p>
                <p className="text-sm text-gray-600 mt-1">Commission sur chaque conversion</p>
              </div>
            </div>
            <Separator className="bg-gray-200" />
            <div>
              <Label className="text-gray-700 mb-2 block">Seuil de paiement minimum</Label>
              <div className="p-4 bg-gray-100 rounded-lg">
                <p className="text-2xl font-bold text-yellow-400">{formatPrice(minPayoutThreshold)}</p>
                <p className="text-sm text-gray-600 mt-1">Montant minimum pour demander un paiement</p>
              </div>
            </div>
            <Separator className="bg-gray-200" />
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label className="text-gray-700">Notifications par email</Label>
                <Checkbox defaultChecked id="email-notifications" />
              </div>
              <p className="text-xs text-gray-600">Recevez des notifications pour les nouvelles conversions et paiements</p>
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label className="text-gray-700">Notifications push</Label>
                <Checkbox defaultChecked id="push-notifications" />
              </div>
              <p className="text-xs text-gray-600">Recevez des notifications push pour les événements importants</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-50 border-gray-200">
          <CardHeader>
            <CardTitle className="text-gray-900">Informations de paiement</CardTitle>
            <CardDescription className="text-gray-600">Configurez vos méthodes de paiement</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-gray-700 mb-2 block">Méthode de paiement préférée</Label>
              <Select defaultValue="bank">
                <SelectTrigger className="w-full bg-white border-gray-200 text-gray-900">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bank">Virement bancaire</SelectItem>
                  <SelectItem value="paypal">PayPal</SelectItem>
                  <SelectItem value="stripe">Stripe</SelectItem>
                  <SelectItem value="crypto">Cryptomonnaie</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-gray-700 mb-2 block">IBAN / Compte bancaire</Label>
              <Input placeholder="FR76 XXXX XXXX XXXX XXXX XXXX XXX" className="bg-white border-gray-200 text-gray-900" />
              <p className="text-xs text-gray-600 mt-1">Utilisé pour les virements bancaires</p>
            </div>
            <div>
              <Label className="text-gray-700 mb-2 block">Email PayPal</Label>
              <Input placeholder="votre@email.com" className="bg-white border-gray-200 text-gray-900" />
              <p className="text-xs text-gray-600 mt-1">Utilisé pour les paiements PayPal</p>
            </div>
            <Button className="w-full bg-purple-600 hover:bg-purple-700">
              <Save className="w-4 h-4 mr-2" />
              Enregistrer les modifications
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-gradient-to-br from-purple-950/50 to-pink-950/50 border-purple-500/20">
        <CardHeader>
          <CardTitle className="text-gray-900 flex items-center gap-2">
            <Trophy className="w-5 h-5 text-yellow-400" />
            Récompenses et Niveaux
          </CardTitle>
          <CardDescription className="text-gray-600">Débloquez des récompenses en fonction de vos performances</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {tiers.map((tier) => (
              <div
                key={tier.level}
                className={`p-4 rounded-lg border-2 transition-all ${
                  tier.unlocked ? 'bg-gray-100 border-purple-500/50' : 'bg-white/20 border-gray-200 opacity-50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{tier.icon}</span>
                    <div>
                      <h4 className="font-semibold text-gray-900">{tier.level}</h4>
                      <p className="text-xs text-gray-600">
                        {tier.min}+ conversions
                        {tier.max !== Infinity && ` - ${tier.max} conversions`}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    {tier.unlocked ? (
                      <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Débloqué
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="border-gray-200">
                        <Lock className="w-3 h-3 mr-1" />
                        Verrouillé
                      </Badge>
                    )}
                  </div>
                </div>
                {tier.unlocked && (
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <p className="text-gray-600">Bonus commission</p>
                        <p className="text-gray-900 font-medium">+{tier.min * 0.5}%</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Paiements</p>
                        <p className="text-gray-900 font-medium">Hebdomadaire</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Support</p>
                        <p className="text-gray-900 font-medium">Prioritaire</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="bg-gray-50 border-gray-200">
        <CardHeader>
          <CardTitle className="text-gray-900 flex items-center gap-2">
            <Award className="w-5 h-5 text-yellow-400" />
            Achievements
          </CardTitle>
          <CardDescription className="text-gray-600">Débloquez des achievements en atteignant des objectifs</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-4">
            {achievements.map((achievement) => (
              <div
                key={achievement.name}
                className={`p-4 rounded-lg border-2 text-center transition-all ${
                  achievement.unlocked ? 'bg-gray-100 border-yellow-500/50' : 'bg-white/20 border-gray-200 opacity-50'
                }`}
              >
                <div className="text-4xl mb-2">{achievement.icon}</div>
                <h4 className="font-semibold text-gray-900 mb-1">{achievement.name}</h4>
                <p className="text-xs text-gray-600 mb-2">{achievement.description}</p>
                {achievement.unlocked ? (
                  <Badge className="bg-green-500/20 text-green-400 border-green-500/30 text-xs">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Débloqué
                  </Badge>
                ) : (
                  <Badge variant="outline" className="border-gray-200 text-xs">
                    Verrouillé
                  </Badge>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
