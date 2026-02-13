'use client';

import { Send } from 'lucide-react';
import { useI18n } from '@/i18n/useI18n';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { CreateTicketDto } from '@/lib/hooks/useSupport';

interface NewTicketDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  newTicket: CreateTicketDto;
  setNewTicket: (v: CreateTicketDto | ((prev: CreateTicketDto) => CreateTicketDto)) => void;
  onSubmit: (e: React.FormEvent) => void;
}

export function NewTicketDialog({
  open,
  onOpenChange,
  newTicket,
  setNewTicket,
  onSubmit,
}: NewTicketDialogProps) {
  const { t } = useI18n();
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl bg-white border-gray-200 text-gray-900 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t('support.newTicketTitle')}</DialogTitle>
          <DialogDescription className="text-gray-600">
            {t('support.newTicketDescription')}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <Label className="text-sm font-medium text-gray-600 mb-2 block">{t('support.subject')} *</Label>
            <Input
              value={newTicket.subject}
              onChange={(e) => setNewTicket({ ...newTicket, subject: e.target.value })}
              placeholder={t('support.subjectPlaceholder')}
              className="bg-white border-gray-200 text-gray-900"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium text-gray-600 mb-2 block">{t('support.category')} *</Label>
              <Select
                value={newTicket.category}
                onValueChange={(value) => setNewTicket({ ...newTicket, category: value as string })}
              >
                <SelectTrigger className="bg-white border-gray-200 text-gray-900">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-white border-gray-200 text-gray-900">
                  <SelectItem value="BILLING">Facturation</SelectItem>
                  <SelectItem value="TECHNICAL">Technique</SelectItem>
                  <SelectItem value="ACCOUNT">Compte</SelectItem>
                  <SelectItem value="FEATURE_REQUEST">Fonctionnalité</SelectItem>
                  <SelectItem value="BUG">Bug</SelectItem>
                  <SelectItem value="INTEGRATION">Intégration</SelectItem>
                  <SelectItem value="OTHER">Autre</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-600 mb-2 block">{t('support.priority')} *</Label>
              <Select
                value={newTicket.priority}
                onValueChange={(value) => setNewTicket({ ...newTicket, priority: value as 'low' | 'medium' | 'high' })}
              >
                <SelectTrigger className="bg-white border-gray-200 text-gray-900">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-white border-gray-200 text-gray-900">
                  <SelectItem value="LOW">{t('support.priorities.low')}</SelectItem>
                  <SelectItem value="MEDIUM">{t('support.priorities.medium')}</SelectItem>
                  <SelectItem value="HIGH">{t('support.priorities.high')}</SelectItem>
                  <SelectItem value="URGENT">{t('support.priorities.urgent')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label className="text-sm font-medium text-gray-600 mb-2 block">{t('support.description')} *</Label>
            <Textarea
              value={newTicket.description ?? ''}
              onChange={(e) => setNewTicket({ ...newTicket, description: e.target.value })}
              placeholder={t('support.descriptionPlaceholder')}
              rows={6}
              className="bg-white border-gray-200 text-gray-900 resize-none"
              required
            />
          </div>
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1 border-gray-200"
            >
              {t('common.cancel')}
            </Button>
            <Button type="submit" className="flex-1 bg-cyan-600 hover:bg-cyan-700">
              <Send className="w-4 h-4 mr-2" />
              {t('support.createTicketSubmit')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
