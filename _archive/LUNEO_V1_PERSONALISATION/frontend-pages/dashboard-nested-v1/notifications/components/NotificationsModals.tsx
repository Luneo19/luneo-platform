'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Save, FileSpreadsheet, FileJson } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useI18n } from '@/i18n/useI18n';
import { logger } from '@/lib/logger';
import type { Notification } from './types';
import { NotificationsPreferencesTab } from './NotificationsPreferencesTab';
import type { NotificationPreferences } from './types';

interface NotificationsModalsProps {
  showPreferencesModal: boolean;
  setShowPreferencesModal: (v: boolean) => void;
  preferences: NotificationPreferences;
  setPreferences: React.Dispatch<React.SetStateAction<NotificationPreferences>>;
  onUpdatePreferences: () => void;
  showExportModal: boolean;
  setShowExportModal: (v: boolean) => void;
  filteredNotifications: Notification[];
}

export function NotificationsModals({
  showPreferencesModal,
  setShowPreferencesModal,
  preferences,
  setPreferences,
  onUpdatePreferences,
  showExportModal,
  setShowExportModal,
  filteredNotifications,
}: NotificationsModalsProps) {
  const { toast } = useToast();
  const { t } = useI18n();

  const handleExportCsv = () => {
    try {
      const headers = ['ID', 'Type', 'Titre', 'Message', 'Lu', 'Archivée', 'Priorité', 'Créée le', 'Lue le'];
      const rows = filteredNotifications.map((n) => [
        n.id,
        n.type,
        n.title,
        n.message.replace(/,/g, ';'),
        n.read ? 'Oui' : 'Non',
        n.archived ? 'Oui' : 'Non',
        n.priority,
        new Date(n.created_at).toLocaleString('fr-FR'),
        n.read_at ? new Date(n.read_at).toLocaleString('fr-FR') : '',
      ]);
      const csv = [headers.join(','), ...rows.map((row) => row.map((cell) => `"${cell}"`).join(','))].join('\n');
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `notifications_${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      toast({ title: t('common.success'), description: t('notifications.exportCsvSuccess') });
      setShowExportModal(false);
    } catch (error) {
      logger.error('Error exporting CSV', { error });
      toast({ title: t('common.error'), description: t('notifications.exportCsvError'), variant: 'destructive' });
    }
  };

  const handleExportJson = () => {
    try {
      const exportData = {
        exportedAt: new Date().toISOString(),
        total: filteredNotifications.length,
        notifications: filteredNotifications.map((n) => ({
          id: n.id,
          type: n.type,
          title: n.title,
          message: n.message,
          read: n.read,
          archived: n.archived,
          priority: n.priority,
          created_at: n.created_at,
          read_at: n.read_at,
          action_url: n.action_url,
          action_label: n.action_label,
          resource_type: n.resource_type,
          resource_id: n.resource_id,
          metadata: n.metadata,
        })),
      };
      const json = JSON.stringify(exportData, null, 2);
      const blob = new Blob([json], { type: 'application/json;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `notifications_${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast({ title: t('common.success'), description: t('notifications.exportJsonSuccess') });
      setShowExportModal(false);
    } catch (error) {
      logger.error('Error exporting JSON', { error });
      toast({ title: t('common.error'), description: t('notifications.exportJsonError'), variant: 'destructive' });
    }
  };

  return (
    <>
      <Dialog open={showPreferencesModal} onOpenChange={setShowPreferencesModal}>
        <DialogContent className="bg-zinc-800 border-zinc-700 text-white max-w-2xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Préférences de notifications</DialogTitle>
            <DialogDescription>Configurez comment et quand vous recevez des notifications</DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[60vh] pr-4">
            <div className="mt-4">
              <NotificationsPreferencesTab preferences={preferences} setPreferences={setPreferences} onSave={onUpdatePreferences} />
            </div>
          </ScrollArea>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPreferencesModal(false)} className="border-zinc-600">
              Annuler
            </Button>
            <Button onClick={onUpdatePreferences} className="bg-cyan-600 hover:bg-cyan-700">
              <Save className="w-4 h-4 mr-2" />
              Enregistrer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showExportModal} onOpenChange={setShowExportModal}>
        <DialogContent className="bg-zinc-800 border-zinc-700 text-white">
          <DialogHeader>
            <DialogTitle>Exporter les notifications</DialogTitle>
            <DialogDescription>Choisissez le format d'export</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <Button variant="outline" onClick={handleExportCsv} className="border-zinc-600">
                <FileSpreadsheet className="w-4 h-4 mr-2" />
                CSV
              </Button>
              <Button variant="outline" onClick={handleExportJson} className="border-zinc-600">
                <FileJson className="w-4 h-4 mr-2" />
                JSON
              </Button>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowExportModal(false)} className="border-zinc-600">
              Fermer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
