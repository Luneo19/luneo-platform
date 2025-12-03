'use client';

/**
 * Privacy & Data Settings Page
 * GDPR compliance UI for data export and account deletion
 */

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Download,
  Trash2,
  Shield,
  AlertTriangle,
  Check,
  Loader2,
  Eye,
  FileJson,
  Clock,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';

export default function PrivacySettingsPage() {
  const { toast } = useToast();
  const [isExporting, setIsExporting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState('');
  const [deletePassword, setDeletePassword] = useState('');
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const handleExportData = async () => {
    setIsExporting(true);
    try {
      const response = await fetch('/api/gdpr/export');
      
      if (!response.ok) {
        throw new Error('Export failed');
      }

      const data = await response.json();
      
      // Create downloadable JSON file
      const blob = new Blob([JSON.stringify(data.data.data, null, 2)], {
        type: 'application/json',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `luneo-data-export-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: 'Export réussi',
        description: 'Vos données ont été téléchargées',
      });
    } catch (error) {
      toast({
        title: 'Erreur',
        description: "Impossible d'exporter vos données",
        variant: 'destructive',
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmation !== 'SUPPRIMER') {
      toast({
        title: 'Confirmation requise',
        description: 'Veuillez taper SUPPRIMER pour confirmer',
        variant: 'destructive',
      });
      return;
    }

    if (!deletePassword) {
      toast({
        title: 'Mot de passe requis',
        description: 'Veuillez entrer votre mot de passe',
        variant: 'destructive',
      });
      return;
    }

    setIsDeleting(true);
    try {
      const response = await fetch('/api/gdpr/delete-account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          confirmation: deleteConfirmation,
          password: deletePassword,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Deletion failed');
      }

      // Redirect to goodbye page
      window.location.href = '/goodbye';
    } catch (error) {
      toast({
        title: 'Erreur',
        description: error instanceof Error ? error.message : "Impossible de supprimer le compte",
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">
          Confidentialité & Données
        </h1>
        <p className="text-slate-400">
          Gérez vos données personnelles conformément au RGPD
        </p>
      </div>

      {/* Data Rights Info */}
      <Card className="bg-blue-900/20 border-blue-500/30">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-blue-500/20 rounded-lg">
              <Shield className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white mb-2">
                Vos droits RGPD
              </h3>
              <p className="text-slate-300 text-sm leading-relaxed">
                Conformément au Règlement Général sur la Protection des Données (RGPD),
                vous avez le droit d'accéder à vos données, de les exporter et de demander
                leur suppression. Ces actions sont irréversibles et prennent effet immédiatement.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Export Data Section */}
      <Card className="bg-slate-900 border-slate-800">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-500/20 rounded-lg">
              <Download className="w-5 h-5 text-green-400" />
            </div>
            <div>
              <CardTitle className="text-white">Exporter mes données</CardTitle>
              <CardDescription>
                Téléchargez une copie de toutes vos données personnelles
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { icon: FileJson, label: 'Profil', desc: 'Informations personnelles' },
              { icon: Eye, label: 'Designs', desc: 'Tous vos créations' },
              { icon: Clock, label: 'Historique', desc: 'Commandes et activités' },
              { icon: Shield, label: 'Paramètres', desc: 'Préférences et config' },
            ].map((item, i) => (
              <div
                key={i}
                className="p-4 bg-slate-800/50 rounded-lg border border-slate-700/50"
              >
                <item.icon className="w-5 h-5 text-slate-400 mb-2" />
                <p className="text-sm font-medium text-white">{item.label}</p>
                <p className="text-xs text-slate-500">{item.desc}</p>
              </div>
            ))}
          </div>

          <Button
            onClick={handleExportData}
            disabled={isExporting}
            className="bg-green-600 hover:bg-green-700"
          >
            {isExporting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Export en cours...
              </>
            ) : (
              <>
                <Download className="w-4 h-4 mr-2" />
                Télécharger mes données (JSON)
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Delete Account Section */}
      <Card className="bg-slate-900 border-red-500/30">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-500/20 rounded-lg">
              <Trash2 className="w-5 h-5 text-red-400" />
            </div>
            <div>
              <CardTitle className="text-white">Supprimer mon compte</CardTitle>
              <CardDescription className="text-red-400">
                Cette action est définitive et irréversible
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 bg-red-500/10 rounded-lg border border-red-500/30">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-slate-300">
                <p className="font-semibold text-red-400 mb-1">Attention !</p>
                <ul className="list-disc list-inside space-y-1 text-slate-400">
                  <li>Tous vos designs seront supprimés</li>
                  <li>Votre historique de commandes sera effacé</li>
                  <li>Vos intégrations seront désactivées</li>
                  <li>Votre abonnement sera annulé (sans remboursement)</li>
                  <li>Cette action ne peut pas être annulée</li>
                </ul>
              </div>
            </div>
          </div>

          <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
            <DialogTrigger asChild>
              <Button
                variant="outline"
                className="border-red-500/50 text-red-400 hover:bg-red-500/10"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Supprimer mon compte
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-slate-900 border-slate-800">
              <DialogHeader>
                <DialogTitle className="text-white flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-red-400" />
                  Confirmer la suppression
                </DialogTitle>
                <DialogDescription className="text-slate-400">
                  Cette action supprimera définitivement votre compte et toutes vos données.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="confirmation" className="text-slate-300">
                    Tapez <span className="text-red-400 font-mono">SUPPRIMER</span> pour confirmer
                  </Label>
                  <Input
                    id="confirmation"
                    value={deleteConfirmation}
                    onChange={(e) => setDeleteConfirmation(e.target.value)}
                    placeholder="SUPPRIMER"
                    className="bg-slate-800 border-slate-700 text-white"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="text-slate-300">
                    Confirmez avec votre mot de passe
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    value={deletePassword}
                    onChange={(e) => setDeletePassword(e.target.value)}
                    placeholder="Votre mot de passe"
                    className="bg-slate-800 border-slate-700 text-white"
                  />
                </div>
              </div>

              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setShowDeleteDialog(false)}
                  className="border-slate-700"
                >
                  Annuler
                </Button>
                <Button
                  onClick={handleDeleteAccount}
                  disabled={isDeleting || deleteConfirmation !== 'SUPPRIMER'}
                  className="bg-red-600 hover:bg-red-700"
                >
                  {isDeleting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Suppression...
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4 mr-2" />
                      Supprimer définitivement
                    </>
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>

      {/* Data Processing Info */}
      <Card className="bg-slate-900 border-slate-800">
        <CardHeader>
          <CardTitle className="text-white">Comment nous utilisons vos données</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 text-sm text-slate-400">
            <div className="flex items-start gap-3">
              <Check className="w-4 h-4 text-green-400 mt-1 flex-shrink-0" />
              <p>
                <span className="text-white font-medium">Fonctionnement du service :</span>{' '}
                Nous utilisons vos données pour fournir et améliorer nos services de personnalisation.
              </p>
            </div>
            <div className="flex items-start gap-3">
              <Check className="w-4 h-4 text-green-400 mt-1 flex-shrink-0" />
              <p>
                <span className="text-white font-medium">Communication :</span>{' '}
                Notifications importantes concernant votre compte et vos commandes.
              </p>
            </div>
            <div className="flex items-start gap-3">
              <Check className="w-4 h-4 text-green-400 mt-1 flex-shrink-0" />
              <p>
                <span className="text-white font-medium">Sécurité :</span>{' '}
                Protection de votre compte et détection des fraudes.
              </p>
            </div>
            <div className="flex items-start gap-3">
              <Check className="w-4 h-4 text-green-400 mt-1 flex-shrink-0" />
              <p>
                <span className="text-white font-medium">Conformité légale :</span>{' '}
                Respect des obligations légales et fiscales.
              </p>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-800">
            <p className="text-sm text-slate-500">
              Pour plus d'informations, consultez notre{' '}
              <a href="/legal/privacy" className="text-blue-400 hover:underline">
                Politique de confidentialité
              </a>{' '}
              et nos{' '}
              <a href="/legal/terms" className="text-blue-400 hover:underline">
                Conditions d'utilisation
              </a>.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

