'use client';

import { Star, Check } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

interface CsatDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  rating: number;
  setRating: (v: number) => void;
  comment: string;
  setComment: (v: string) => void;
  onSubmit: (ticketId: string) => void;
  ticketId: string | null;
}

export function CsatDialog({
  open,
  onOpenChange,
  rating,
  setRating,
  comment,
  setComment,
  onSubmit,
  ticketId,
}: CsatDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-white border-gray-200 text-gray-900">
        <DialogHeader>
          <DialogTitle>Évaluer la résolution</DialogTitle>
          <DialogDescription className="text-gray-600">
            Comment évaluez-vous la résolution de ce ticket ?
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label className="text-sm text-gray-600 mb-3 block">Note</Label>
            <div className="flex items-center gap-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setRating(i + 1)}
                  className={cn(
                    'w-12 h-12 rounded-lg transition-all',
                    i < rating ? 'bg-yellow-500/20 border-2 border-yellow-500' : 'bg-gray-50 border-2 border-gray-200'
                  )}
                >
                  <Star
                    className={cn(
                      'w-6 h-6 mx-auto',
                      i < rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-400'
                    )}
                  />
                </button>
              ))}
            </div>
          </div>
          <div>
            <Label className="text-sm text-gray-600 mb-2 block">Commentaire (optionnel)</Label>
            <Textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Partagez vos commentaires..."
              className="bg-gray-50 border-gray-200 text-gray-900"
              rows={3}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} className="border-gray-200">
            Annuler
          </Button>
          <Button
            onClick={() => ticketId && onSubmit(ticketId)}
            disabled={rating === 0}
            className="bg-cyan-600 hover:bg-cyan-700"
          >
            <Check className="w-4 h-4 mr-2" />
            Envoyer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
