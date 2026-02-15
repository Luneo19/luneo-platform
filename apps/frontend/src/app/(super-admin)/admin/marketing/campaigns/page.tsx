'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Plus, Send, Clock, CheckCircle, XCircle, BarChart3, Mail, Users } from 'lucide-react';
import { api } from '@/lib/api/client';
import { logger } from '@/lib/logger';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface Campaign {
  id: string;
  name: string;
  subject: string;
  status: 'draft' | 'scheduled' | 'sent' | 'failed';
  recipientCount: number;
  openRate?: number;
  clickRate?: number;
  createdAt: string;
  scheduledAt?: string;
  sentAt?: string;
}

export default function CampaignsPage() {
  const { toast } = useToast();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newCampaign, setNewCampaign] = useState({ name: '', subject: '', body: '', audience: 'all' });
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    loadCampaigns();
  }, []);

  const loadCampaigns = async () => {
    try {
      setIsLoading(true);
      const data = await api.get<{ campaigns?: Campaign[] }>('/api/v1/admin/marketing/campaigns');
      setCampaigns(Array.isArray(data?.campaigns) ? data.campaigns : []);
    } catch (error) {
      logger.error('Failed to load campaigns', { error: String(error) });
      setCampaigns([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateCampaign = async () => {
    if (!newCampaign.name || !newCampaign.subject || !newCampaign.body) {
      toast({ title: 'Champs requis', description: 'Veuillez remplir tous les champs.', variant: 'destructive' });
      return;
    }

    setIsSending(true);
    try {
      await api.post('/api/v1/admin/marketing/campaigns', newCampaign);
      toast({ title: 'Campagne créée', description: 'La campagne a été créée avec succès.' });
      setShowCreate(false);
      setNewCampaign({ name: '', subject: '', body: '', audience: 'all' });
      loadCampaigns();
    } catch (error) {
      logger.error('Failed to create campaign', { error: String(error) });
      toast({ title: 'Erreur', description: 'Impossible de créer la campagne.', variant: 'destructive' });
    } finally {
      setIsSending(false);
    }
  };

  const statusConfig: Record<string, { icon: React.ReactNode; color: string; label: string }> = {
    draft: { icon: <Clock className="w-3.5 h-3.5" />, color: 'bg-zinc-500/20 text-zinc-400', label: 'Brouillon' },
    scheduled: { icon: <Clock className="w-3.5 h-3.5" />, color: 'bg-blue-500/20 text-blue-400', label: 'Planifiée' },
    sent: { icon: <CheckCircle className="w-3.5 h-3.5" />, color: 'bg-green-500/20 text-green-400', label: 'Envoyée' },
    failed: { icon: <XCircle className="w-3.5 h-3.5" />, color: 'bg-red-500/20 text-red-400', label: 'Échouée' },
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin/marketing">
            <Button variant="ghost" size="sm" className="text-zinc-400 hover:text-white">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Retour
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-white">Campagnes Email</h1>
            <p className="text-zinc-400 mt-1">Créer et gérer vos campagnes email marketing</p>
          </div>
        </div>
        <Button onClick={() => setShowCreate(!showCreate)}>
          <Plus className="w-4 h-4 mr-2" />
          Nouvelle campagne
        </Button>
      </div>

      {showCreate && (
        <Card className="bg-zinc-800 border-zinc-700">
          <CardHeader>
            <CardTitle className="text-white">Nouvelle campagne</CardTitle>
            <CardDescription className="text-zinc-400">Configurez et envoyez une campagne email</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-zinc-300">Nom de la campagne</Label>
              <Input
                value={newCampaign.name}
                onChange={(e) => setNewCampaign((p) => ({ ...p, name: e.target.value }))}
                placeholder="Ex: Newsletter Février 2026"
                className="bg-zinc-900 border-zinc-700 text-white mt-1"
              />
            </div>
            <div>
              <Label className="text-zinc-300">Objet de l'email</Label>
              <Input
                value={newCampaign.subject}
                onChange={(e) => setNewCampaign((p) => ({ ...p, subject: e.target.value }))}
                placeholder="Ex: Découvrez nos nouvelles fonctionnalités"
                className="bg-zinc-900 border-zinc-700 text-white mt-1"
              />
            </div>
            <div>
              <Label className="text-zinc-300">Audience</Label>
              <Select value={newCampaign.audience} onValueChange={(v) => setNewCampaign((p) => ({ ...p, audience: v }))}>
                <SelectTrigger className="bg-zinc-900 border-zinc-700 text-white mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les utilisateurs</SelectItem>
                  <SelectItem value="active">Utilisateurs actifs (30j)</SelectItem>
                  <SelectItem value="premium">Utilisateurs Premium</SelectItem>
                  <SelectItem value="enterprise">Utilisateurs Enterprise</SelectItem>
                  <SelectItem value="inactive">Utilisateurs inactifs</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-zinc-300">Contenu</Label>
              <Textarea
                value={newCampaign.body}
                onChange={(e) => setNewCampaign((p) => ({ ...p, body: e.target.value }))}
                placeholder="Corps de l'email..."
                className="bg-zinc-900 border-zinc-700 text-white mt-1 min-h-[120px]"
              />
            </div>
            <div className="flex gap-2 pt-2">
              <Button variant="outline" className="border-zinc-700" onClick={() => setShowCreate(false)}>
                Annuler
              </Button>
              <Button onClick={handleCreateCampaign} disabled={isSending}>
                <Send className="w-4 h-4 mr-2" />
                {isSending ? 'Envoi...' : 'Créer la campagne'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-zinc-800 border-zinc-700">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Mail className="w-8 h-8 text-cyan-400" />
              <div>
                <p className="text-2xl font-bold text-white">{campaigns.length}</p>
                <p className="text-zinc-400 text-sm">Campagnes totales</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-zinc-800 border-zinc-700">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Users className="w-8 h-8 text-green-400" />
              <div>
                <p className="text-2xl font-bold text-white">
                  {campaigns.reduce((acc, c) => acc + (c.recipientCount || 0), 0).toLocaleString()}
                </p>
                <p className="text-zinc-400 text-sm">Emails envoyés</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-zinc-800 border-zinc-700">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <BarChart3 className="w-8 h-8 text-purple-400" />
              <div>
                <p className="text-2xl font-bold text-white">
                  {campaigns.length > 0
                    ? (campaigns.reduce((acc, c) => acc + (c.openRate || 0), 0) / campaigns.length).toFixed(1)
                    : '0'}%
                </p>
                <p className="text-zinc-400 text-sm">Taux d'ouverture moyen</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Campaigns list */}
      <Card className="bg-zinc-800 border-zinc-700">
        <CardHeader>
          <CardTitle className="text-white">Campagnes ({campaigns.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-16 bg-zinc-700 rounded animate-pulse" />
              ))}
            </div>
          ) : campaigns.length === 0 ? (
            <div className="text-center py-12 text-zinc-400">
              <Mail className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p className="mb-4">Aucune campagne créée</p>
              <Button onClick={() => setShowCreate(true)}>Créer votre première campagne</Button>
            </div>
          ) : (
            <div className="space-y-3">
              {campaigns.map((campaign) => {
                const status = statusConfig[campaign.status] || statusConfig.draft;
                return (
                  <div key={campaign.id} className="flex items-center justify-between p-4 bg-zinc-900 rounded-lg">
                    <div>
                      <p className="text-white font-medium">{campaign.name}</p>
                      <p className="text-zinc-400 text-sm mt-1">{campaign.subject}</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right text-sm">
                        <p className="text-zinc-400">{campaign.recipientCount} destinataires</p>
                        {campaign.openRate !== undefined && (
                          <p className="text-zinc-500">{campaign.openRate}% ouverture</p>
                        )}
                      </div>
                      <Badge variant="secondary" className={status.color}>
                        <span className="flex items-center gap-1">
                          {status.icon}
                          {status.label}
                        </span>
                      </Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

