'use client';

import { useState, useEffect } from 'react';
import { Copy, Mail, Twitter, Facebook, RefreshCw, QrCode } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useDesign } from '@/hooks/customizer/useDesign';
import { useToast } from '@/hooks/use-toast';
import Image from 'next/image';

interface ShareDesignDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  designId: string;
}

/**
 * ShareDesignDialog - Share design dialog
 */
export function ShareDesignDialog({ open, onOpenChange, designId }: ShareDesignDialogProps) {
  const { toast } = useToast();
  const { shareDesign } = useDesign();
  
  const [shareUrl, setShareUrl] = useState('');
  const [expiration, setExpiration] = useState<string>('7');
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);

  useEffect(() => {
    if (open && designId) {
      generateShareLink();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, designId]);

  const generateShareLink = async () => {
    try {
      const expiresInDays = expiration === 'never' ? undefined : Number(expiration);
      const result = await shareDesign(designId, expiresInDays);
      setShareUrl(result.shareUrl);
      
      // Generate QR code (in a real implementation, you'd use a QR code library)
      // For now, using a placeholder service
      setQrCodeUrl(`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(result.shareUrl)}`);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to generate share link',
        variant: 'destructive',
      });
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(shareUrl);
    toast({
      title: 'Copied',
      description: 'Share URL copied to clipboard',
    });
  };

  const handleEmailShare = () => {
    window.location.href = `mailto:?subject=Check out this design&body=${encodeURIComponent(shareUrl)}`;
  };

  const handleTwitterShare = () => {
    window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}`, '_blank');
  };

  const handleFacebookShare = () => {
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`, '_blank');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Share Design</DialogTitle>
          <DialogDescription>
            Share your design with others
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Share URL */}
          <div className="space-y-2">
            <Label>Share URL</Label>
            <div className="flex gap-2">
              <Input
                value={shareUrl}
                readOnly
                className="flex-1 font-mono text-sm"
              />
              <Button variant="outline" size="icon" onClick={handleCopy}>
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Expiration */}
          <div className="space-y-2">
            <Label>Expiration</Label>
            <Select value={expiration} onValueChange={setExpiration}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">1 day</SelectItem>
                <SelectItem value="7">7 days</SelectItem>
                <SelectItem value="30">30 days</SelectItem>
                <SelectItem value="never">Never</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Social Sharing */}
          <div className="space-y-2">
            <Label>Share via</Label>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={handleCopy}>
                <Copy className="h-4 w-4 mr-2" />
                Copy
              </Button>
              <Button variant="outline" className="flex-1" onClick={handleEmailShare}>
                <Mail className="h-4 w-4 mr-2" />
                Email
              </Button>
              <Button variant="outline" className="flex-1" onClick={handleTwitterShare}>
                <Twitter className="h-4 w-4 mr-2" />
                Twitter
              </Button>
              <Button variant="outline" className="flex-1" onClick={handleFacebookShare}>
                <Facebook className="h-4 w-4 mr-2" />
                Facebook
              </Button>
            </div>
          </div>

          {/* QR Code */}
          {qrCodeUrl && (
            <div className="space-y-2">
              <Label>QR Code</Label>
              <div className="flex items-center justify-center p-4 border rounded-lg bg-muted/50">
                <Image src={qrCodeUrl} alt="QR Code" className="w-48 h-48" width={200} height={200} unoptimized />
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          <Button onClick={generateShareLink}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Generate New Link
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
