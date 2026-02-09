'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';

const WEBHOOK_EVENTS = [
  { value: 'design.created', label: 'Design créé' },
  { value: 'design.updated', label: 'Design modifié' },
  { value: 'design.completed', label: 'Design terminé' },
  { value: 'design.failed', label: 'Design échoué' },
  { value: 'order.created', label: 'Commande créée' },
  { value: 'order.updated', label: 'Commande modifiée' },
  { value: 'order.paid', label: 'Commande payée' },
  { value: 'order.shipped', label: 'Commande expédiée' },
  { value: 'order.delivered', label: 'Commande livrée' },
  { value: 'order.cancelled', label: 'Commande annulée' },
];

interface CreateWebhookModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: {
    name: string;
    url: string;
    secret?: string;
    events: string[];
    isActive?: boolean;
  }) => void;
  isLoading?: boolean;
}

export function CreateWebhookModal({
  open,
  onClose,
  onSubmit,
  isLoading = false,
}: CreateWebhookModalProps) {
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [secret, setSecret] = useState('');
  const [selectedEvents, setSelectedEvents] = useState<string[]>([]);
  const [isActive, setIsActive] = useState(true);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !url || selectedEvents.length === 0) {
      return;
    }
    onSubmit({
      name,
      url,
      secret: secret || undefined,
      events: selectedEvents,
      isActive,
    });
    // Reset form
    setName('');
    setUrl('');
    setSecret('');
    setSelectedEvents([]);
    setIsActive(true);
  };

  const toggleEvent = (event: string) => {
    setSelectedEvents((prev) =>
      prev.includes(event)
        ? prev.filter((e) => e !== event)
        : [...prev, event]
    );
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="dash-card border-white/[0.06] bg-[#12121a] text-white max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Créer un webhook</DialogTitle>
          <DialogDescription className="text-white/60">
            Configurez un nouveau webhook pour recevoir des notifications en temps réel
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="name">Nom du webhook</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Mon webhook"
              required
              className="bg-white/[0.04] border-white/[0.06] text-white"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="url">URL du webhook</Label>
            <Input
              id="url"
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://example.com/webhook"
              required
              className="bg-white/[0.04] border-white/[0.06] text-white"
            />
            <p className="text-sm text-white/60">
              L'URL qui recevra les notifications webhook
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="secret">Secret (optionnel)</Label>
            <Input
              id="secret"
              type="password"
              value={secret}
              onChange={(e) => setSecret(e.target.value)}
              placeholder="Votre secret pour la signature"
              className="bg-white/[0.04] border-white/[0.06] text-white"
            />
            <p className="text-sm text-white/60">
              Secret utilisé pour signer les webhooks (HMAC SHA256)
            </p>
          </div>

          <div className="space-y-2">
            <Label>Événements à écouter</Label>
            <div className="grid grid-cols-2 gap-3 p-4 bg-white/[0.04] rounded-lg border border-white/[0.06]">
              {WEBHOOK_EVENTS.map((event) => (
                <div key={event.value} className="flex items-center space-x-2">
                  <Checkbox
                    id={event.value}
                    checked={selectedEvents.includes(event.value)}
                    onCheckedChange={() => toggleEvent(event.value)}
                    className="border-white/20"
                  />
                  <Label
                    htmlFor={event.value}
                    className="text-sm font-normal cursor-pointer"
                  >
                    {event.label}
                  </Label>
                </div>
              ))}
            </div>
            {selectedEvents.length === 0 && (
              <p className="text-sm text-red-400">
                Sélectionnez au moins un événement
              </p>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="isActive"
              checked={isActive}
              onCheckedChange={(checked) => setIsActive(checked === true)}
              className="border-white/20"
            />
            <Label htmlFor="isActive" className="cursor-pointer text-white/80">
              Activer le webhook immédiatement
            </Label>
          </div>

          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="ghost"
              onClick={onClose}
              disabled={isLoading}
            >
              Annuler
            </Button>
            <Button
              type="submit"
              disabled={isLoading || !name || !url || selectedEvents.length === 0}
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:opacity-90"
            >
              {isLoading ? 'Création...' : 'Créer le webhook'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
