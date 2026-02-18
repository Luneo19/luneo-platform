'use client';

import React, { useState, useEffect } from 'react';
import { Share2, Copy, Mail, QrCode } from 'lucide-react';
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
import { useConfigurator3DStore } from '@/stores/configurator-3d/configurator.store';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

export interface ShareModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ShareModal({ open, onOpenChange }: ShareModalProps) {
  const [shareUrl, setShareUrl] = useState('');
  const { toast } = useToast();
  const sessionId = useConfigurator3DStore((s) => s.sessionId);

  useEffect(() => {
    if (open && typeof window !== 'undefined') {
      const url = sessionId
        ? `${window.location.origin}${window.location.pathname}?session=${sessionId}`
        : window.location.href;
      setShareUrl(url);
    }
  }, [open, sessionId]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      toast({ title: 'Link copied to clipboard' });
    } catch {
      toast({
        title: 'Copy failed',
        variant: 'destructive',
      });
    }
  };

  const handleEmailShare = () => {
    const subject = encodeURIComponent('Check out my 3D configuration');
    const body = encodeURIComponent(
      `I've created a custom configuration. View it here: ${shareUrl}`
    );
    window.open(`mailto:?subject=${subject}&body=${body}`, '_blank');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="h-5 w-5" />
            Share Configuration
          </DialogTitle>
          <DialogDescription>
            Share your configuration with others via link, email, or QR code.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Share link</Label>
            <div className="flex gap-2">
              <Input
                readOnly
                value={shareUrl}
                className="font-mono text-sm"
              />
              <Button variant="outline" size="icon" onClick={handleCopy}>
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={handleCopy}>
              <Copy className="mr-2 h-4 w-4" />
              Copy Link
            </Button>
            <Button variant="outline" onClick={handleEmailShare}>
              <Mail className="mr-2 h-4 w-4" />
              Email
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                toast({
                  title: 'QR Code',
                  description: 'QR code generation can be integrated here.',
                });
              }}
            >
              <QrCode className="mr-2 h-4 w-4" />
              QR Code
            </Button>
          </div>

          <p className="text-xs text-muted-foreground">
            Anyone with this link can view your configuration. For private sharing, save your design first.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
