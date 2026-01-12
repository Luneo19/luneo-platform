'use client';

import { useState, useEffect } from 'react';
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

interface Webhook {
  id: string;
  name: string;
  url: string;
  events: string[];
  isActive: boolean;
}

interface EditWebhookModalProps {
  open: boolean;
  onClose: () => void;
  webhook: Webhook;
  onSubmit: (data: {
    name?: string;
    url?: string;
    secret?: string;
    events?: string[];
    isActive?: boolean;
  }) => void;
  isLoading?: boolean;
}

export function EditWebhookModal({
  open,
  onClose,
  webhook,
  onSubmit,
  isLoading = false,
}: EditWebhookModalProps) {
  const [name, setName] = useState(webhook.name);
  const [url, setUrl] = useState(webhook.url);
  const [secret, setSecret] = useState('');
  const [selectedEvents, setSelectedEvents] = useState<string[]>(webhook.events);
  const [isActive, setIsActive] = useState(webhook.isActive);

  useEffect(() => {
    if (open) {
      setName(webhook.name);
      setUrl(webhook.url);
      setSecret('');
      setSelectedEvents(webhook.events);
      setIsActive(webhook.isActive);
    }
  }, [open, webhook]);

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
      <DialogContent className="bg-gray-800 border-gray-700 text-white max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Modifier le webhook</DialogTitle>
          <DialogDescription className="text-gray-400">
            Modifiez la configuration de votre webhook
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
              className="bg-gray-700 border-gray-600"
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
              className="bg-gray-700 border-gray-600"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="secret">Nouveau secret (optionnel)</Label>
            <Input
              id="secret"
              type="password"
              value={secret}
              onChange={(e) => setSecret(e.target.value)}
              placeholder="Laisser vide pour ne pas modifier"
              className="bg-gray-700 border-gray-600"
            />
            <p className="text-sm text-gray-400">
              Laissez vide pour conserver le secret actuel
            </p>
          </div>

          <div className="space-y-2">
            <Label>Événements à écouter</Label>
            <div className="grid grid-cols-2 gap-3 p-4 bg-gray-700/50 rounded-lg border border-gray-600">
              {WEBHOOK_EVENTS.map((event) => (
                <div key={event.value} className="flex items-center space-x-2">
                  <Checkbox
                    id={event.value}
                    checked={selectedEvents.includes(event.value)}
                    onCheckedChange={() => toggleEvent(event.value)}
                    className="border-gray-500"
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
              className="border-gray-500"
            />
            <Label htmlFor="isActive" className="cursor-pointer">
              Webhook actif
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
              className="bg-cyan-600 hover:bg-cyan-700"
            >
              {isLoading ? 'Mise à jour...' : 'Enregistrer'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
