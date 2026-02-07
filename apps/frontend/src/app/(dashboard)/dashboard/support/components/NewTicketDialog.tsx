'use client';

import { Send } from 'lucide-react';
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
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl bg-gray-800 border-gray-700 text-white max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nouveau ticket</DialogTitle>
          <DialogDescription className="text-gray-400">
            Créez un nouveau ticket de support. Notre équipe vous répondra dans les plus brefs délais.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <Label className="text-sm font-medium text-gray-300 mb-2 block">Sujet *</Label>
            <Input
              value={newTicket.subject}
              onChange={(e) => setNewTicket({ ...newTicket, subject: e.target.value })}
              placeholder="Décrivez brièvement votre problème"
              className="bg-gray-900 border-gray-600 text-white"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium text-gray-300 mb-2 block">Catégorie *</Label>
              <Select
                value={newTicket.category}
                onValueChange={(value) => setNewTicket({ ...newTicket, category: value as string })}
              >
                <SelectTrigger className="bg-gray-900 border-gray-600 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-700 text-white">
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
              <Label className="text-sm font-medium text-gray-300 mb-2 block">Priorité *</Label>
              <Select
                value={newTicket.priority}
                onValueChange={(value) => setNewTicket({ ...newTicket, priority: value as 'low' | 'medium' | 'high' })}
              >
                <SelectTrigger className="bg-gray-900 border-gray-600 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-700 text-white">
                  <SelectItem value="LOW">Basse</SelectItem>
                  <SelectItem value="MEDIUM">Moyenne</SelectItem>
                  <SelectItem value="HIGH">Haute</SelectItem>
                  <SelectItem value="URGENT">Urgente</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label className="text-sm font-medium text-gray-300 mb-2 block">Description *</Label>
            <Textarea
              value={newTicket.description ?? ''}
              onChange={(e) => setNewTicket({ ...newTicket, description: e.target.value })}
              placeholder="Décrivez votre problème en détail. Plus vous fournissez d'informations, plus nous pourrons vous aider rapidement."
              rows={6}
              className="bg-gray-900 border-gray-600 text-white resize-none"
              required
            />
          </div>
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1 border-gray-600"
            >
              Annuler
            </Button>
            <Button type="submit" className="flex-1 bg-cyan-600 hover:bg-cyan-700">
              <Send className="w-4 h-4 mr-2" />
              Créer le ticket
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
