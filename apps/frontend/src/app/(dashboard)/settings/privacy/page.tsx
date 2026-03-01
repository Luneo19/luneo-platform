'use client';

/**
 * Privacy & Data Settings Page
 * GDPR compliance UI for data export and account deletion
 */

import { useState, memo } from 'react';
import { endpoints } from '@/lib/api/client';
import { ErrorBoundary } from '@/components/ErrorBoundary';
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
import { useI18n } from '@/i18n/useI18n';
import { getErrorDisplayMessage } from '@/lib/hooks/useErrorToast';

function PrivacySettingsPageContent() {
  const { toast } = useToast();
  const { t } = useI18n();
  const [isExporting, setIsExporting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState('');
  const [deletePassword, setDeletePassword] = useState('');
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const handleExportData = async () => {
    setIsExporting(true);
    try {
      const data = await endpoints.security.exportData();
      type ExportPayload = Record<string, unknown> | unknown[];
      const wrapped = data as { data?: { data?: ExportPayload } | ExportPayload };
      const exportData: ExportPayload =
        (wrapped?.data && typeof wrapped.data === 'object' && 'data' in wrapped.data
          ? (wrapped.data as { data?: ExportPayload }).data
          : (wrapped?.data as ExportPayload)) ?? data as ExportPayload;
      const blob = new Blob([JSON.stringify(exportData, null, 2)], {
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
        title: t('privacy.exportSuccessTitle'),
        description: t('privacy.exportSuccessDesc'),
      });
    } catch (error) {
      toast({
        title: t('common.error'),
        description: t('privacy.exportErrorDesc'),
        variant: 'destructive',
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmation !== 'SUPPRIMER') {
      toast({
        title: t('privacy.confirmRequired'),
        description: t('privacy.confirmTypeSupprimer'),
        variant: 'destructive',
      });
      return;
    }

    if (!deletePassword) {
      toast({
        title: t('privacy.passwordRequired'),
        description: t('privacy.passwordRequiredDesc'),
        variant: 'destructive',
      });
      return;
    }

    setIsDeleting(true);
    try {
      await endpoints.security.deleteAccount({
        password: deletePassword,
        reason: deleteConfirmation || 'User requested account deletion',
      });

      // Redirect to goodbye page
      window.location.href = '/goodbye';
    } catch (error) {
      toast({
        title: t('common.error'),
        description: getErrorDisplayMessage(error),
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
          {t('privacy.pageTitle')}
        </h1>
        <p className="text-slate-200">
          {t('privacy.pageSubtitle')}
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
                {t('privacy.gdprRightsTitle')}
              </h3>
              <p className="text-slate-100 text-sm leading-relaxed">
                {t('privacy.gdprRightsDesc')}
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
              <CardTitle className="text-white">{t('privacy.exportTitle')}</CardTitle>
              <CardDescription>
                {t('privacy.exportDesc')}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { icon: FileJson, label: t('privacy.exportProfile'), desc: t('privacy.exportProfileDesc') },
              { icon: Eye, label: t('privacy.exportDesigns'), desc: t('privacy.exportDesignsDesc') },
              { icon: Clock, label: t('privacy.exportHistory'), desc: t('privacy.exportHistoryDesc') },
              { icon: Shield, label: t('common.settings'), desc: t('privacy.exportSettingsDesc') },
            ].map((item, i) => (
              <div
                key={i}
                className="p-4 bg-slate-800/50 rounded-lg border border-slate-700/50"
              >
                <item.icon className="w-5 h-5 text-slate-200 mb-2" />
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
                {t('privacy.exportInProgress')}
              </>
            ) : (
              <>
                <Download className="w-4 h-4 mr-2" />
                {t('privacy.downloadDataJson')}
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
              <CardTitle className="text-white">{t('privacy.deleteAccountTitle')}</CardTitle>
              <CardDescription className="text-red-400">
                {t('privacy.deleteAccountIrreversible')}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 bg-red-500/10 rounded-lg border border-red-500/30">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-slate-100">
                <p className="font-semibold text-red-400 mb-1">{t('privacy.warningTitle')}</p>
                <ul className="list-disc list-inside space-y-1 text-slate-200">
                  <li>{t('privacy.warningDesigns')}</li>
                  <li>{t('privacy.warningOrders')}</li>
                  <li>{t('privacy.warningIntegrations')}</li>
                  <li>{t('privacy.warningSubscription')}</li>
                  <li>{t('privacy.warningCannotUndo')}</li>
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
                {t('privacy.deleteAccount')}
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-slate-900 border-slate-800">
              <DialogHeader>
                <DialogTitle className="text-white flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-red-400" />
                  {t('privacy.deleteConfirmTitle')}
                </DialogTitle>
                <DialogDescription className="text-slate-200">
                  {t('privacy.deleteConfirmDesc')}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="confirmation" className="text-slate-100">
                    {t('privacy.typeToConfirmLabel')}
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
                  <Label htmlFor="password" className="text-slate-100">
                    {t('privacy.confirmWithPassword')}
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    value={deletePassword}
                    onChange={(e) => setDeletePassword(e.target.value)}
                    placeholder={t('privacy.passwordPlaceholder')}
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
                  {t('common.cancel')}
                </Button>
                <Button
                  onClick={handleDeleteAccount}
                  disabled={isDeleting || deleteConfirmation !== 'SUPPRIMER'}
                  className="bg-red-600 hover:bg-red-700"
                >
                  {isDeleting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      {t('privacy.deleting')}
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4 mr-2" />
                      {t('privacy.deletePermanently')}
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
          <CardTitle className="text-white">{t('privacy.howWeUseDataTitle')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 text-sm text-slate-200">
            <div className="flex items-start gap-3">
              <Check className="w-4 h-4 text-green-400 mt-1 flex-shrink-0" />
              <p>
                <span className="text-white font-medium">{t('privacy.dataUseService')}</span>{' '}
                {t('privacy.dataUseServiceDesc')}
              </p>
            </div>
            <div className="flex items-start gap-3">
              <Check className="w-4 h-4 text-green-400 mt-1 flex-shrink-0" />
              <p>
                <span className="text-white font-medium">{t('privacy.dataUseCommunication')}</span>{' '}
                {t('privacy.dataUseCommunicationDesc')}
              </p>
            </div>
            <div className="flex items-start gap-3">
              <Check className="w-4 h-4 text-green-400 mt-1 flex-shrink-0" />
              <p>
                <span className="text-white font-medium">{t('privacy.dataUseSecurity')}</span>{' '}
                {t('privacy.dataUseSecurityDesc')}
              </p>
            </div>
            <div className="flex items-start gap-3">
              <Check className="w-4 h-4 text-green-400 mt-1 flex-shrink-0" />
              <p>
                <span className="text-white font-medium">{t('privacy.dataUseLegal')}</span>{' '}
                {t('privacy.dataUseLegalDesc')}
              </p>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-800">
            <p className="text-sm text-slate-500">
              {t('privacy.legalLinksPrefix')}{' '}
              <a href="/legal/privacy" className="text-blue-400 hover:underline">
                {t('privacy.privacyPolicyLink')}
              </a>{' '}
              {t('privacy.legalLinksAnd')}{' '}
              <a href="/legal/terms" className="text-blue-400 hover:underline">
                {t('privacy.termsLink')}
              </a>.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

const MemoizedPrivacySettingsPageContent = memo(PrivacySettingsPageContent);

export default function PrivacySettingsPage() {
  return (
    <ErrorBoundary level="page" componentName="PrivacySettingsPage">
      <MemoizedPrivacySettingsPageContent />
    </ErrorBoundary>
  );
}

