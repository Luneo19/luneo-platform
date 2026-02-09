/**
 * Modal d'affichage des codes de secours
 */

'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Copy, Download, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface BackupCodesModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  backupCodes?: string[];
}

export function BackupCodesModal({
  open,
  onOpenChange,
  backupCodes = [],
}: BackupCodesModalProps) {
  const { toast } = useToast();
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const handleCopy = (code: string, index: number) => {
    navigator.clipboard.writeText(code);
    setCopiedIndex(index);
    toast({ title: 'Copié', description: 'Code copié dans le presse-papiers' });
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const handleDownload = () => {
    const content = backupCodes.join('\n');
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `luneo-backup-codes-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast({ title: 'Téléchargé', description: 'Codes de secours téléchargés' });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="dash-card border-white/[0.06] bg-[#12121a] text-white max-w-2xl">
        <DialogHeader>
          <DialogTitle>Codes de secours</DialogTitle>
          <DialogDescription>
            Utilisez ces codes pour accéder à votre compte si vous perdez l'accès à votre appareil 2FA
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 mt-4">
          <div className="p-4 bg-yellow-950/20 border border-yellow-500/30 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-5 h-5 text-yellow-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-yellow-400 mb-1">
                  Important: Enregistrez ces codes en lieu sûr
                </p>
                <p className="text-xs text-white/60">
                  Ces codes ne seront affichés qu'une seule fois. Chaque code ne peut être utilisé qu'une fois.
                </p>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {backupCodes.map((code, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 bg-white/[0.04] rounded-lg border border-white/[0.06]"
              >
                <code className="text-sm font-mono text-cyan-400">{code}</code>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleCopy(code, index)}
                  className="h-8 w-8 p-0"
                >
                  <Copy className={`w-4 h-4 ${copiedIndex === index ? 'text-green-400' : ''}`} />
                </Button>
              </div>
            ))}
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} className="border-white/[0.06] hover:bg-white/[0.04]">
            Fermer
          </Button>
          <Button onClick={handleDownload} className="bg-cyan-600 hover:bg-cyan-700">
            <Download className="w-4 h-4 mr-2" />
            Télécharger les codes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}



