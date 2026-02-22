'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { logger } from '@/lib/logger';
import { Copy, Download } from 'lucide-react';
import Image from 'next/image';

export type QRCodeStyle = 'squares' | 'dots' | 'rounded';

export interface QRCodeGeneratorProps {
  url: string;
  size?: number;
  fgColor?: string;
  bgColor?: string;
  style?: QRCodeStyle;
  logoUrl?: string;
  showDownload?: boolean;
  showCopyLink?: boolean;
  onCopyLabel?: string;
  className?: string;
}

export function QRCodeGenerator({
  url,
  size = 200,
  fgColor = '#000000',
  bgColor = '#ffffff',
  style = 'squares',
  logoUrl,
  showDownload = true,
  showCopyLink = true,
  onCopyLabel = 'Link copied',
  className,
}: QRCodeGeneratorProps) {
  const [dataUrl, setDataUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (!url) {
      setDataUrl(null);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);

    import('qrcode')
      .then((QRCode) => {
        if (cancelled) return;
        const opts: import('qrcode').QRCodeToDataURLOptions = {
          width: size,
          margin: 2,
          color: { dark: fgColor, light: bgColor },
        };
        if (style === 'dots') {
          opts.errorCorrectionLevel = 'M';
        }
        return QRCode.default.toDataURL(url, opts);
      })
      .then((dataUrlResult) => {
        if (!cancelled) setDataUrl(dataUrlResult ?? null);
      })
      .catch((err) => {
        if (!cancelled) {
          logger.error('QRCodeGenerator: failed', { error: err });
          setDataUrl(null);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [url, size, fgColor, bgColor, style]);

  const handleCopyLink = useCallback(() => {
    navigator.clipboard.writeText(url).then(
      () => toast({ title: onCopyLabel }),
      () => toast({ title: 'Copy failed', variant: 'destructive' })
    );
  }, [url, onCopyLabel, toast]);

  const handleDownload = useCallback(() => {
    if (!dataUrl) return;
    const link = document.createElement('a');
    link.download = `qr-${Date.now()}.png`;
    link.href = dataUrl;
    link.click();
    toast({ title: 'Download started' });
  }, [dataUrl, toast]);

  if (!url) return null;

  return (
    <div className={className}>
      <div className="flex flex-col items-center gap-3">
        <div className="relative flex items-center justify-center rounded-lg bg-white p-2" style={{ width: size + 16, height: size + 16 }}>
          {loading ? (
            <div className="flex h-12 w-12 animate-pulse items-center justify-center rounded bg-gray-200" aria-busy="true" />
          ) : dataUrl ? (
            <Image src={dataUrl} alt="QR Code" width={size} height={size} className="rounded" unoptimized />
          ) : (
            <span className="text-sm text-gray-500">Unable to generate QR code</span>
          )}
        </div>
        <div className="flex gap-2 w-full justify-center flex-wrap">
          {showCopyLink && (
            <Button type="button" variant="outline" size="sm" onClick={handleCopyLink} aria-label="Copy short link">
              <Copy className="h-4 w-4 mr-1" />
              Copy link
            </Button>
          )}
          {showDownload && dataUrl && (
            <Button type="button" variant="outline" size="sm" onClick={handleDownload} aria-label="Download QR code as PNG">
              <Download className="h-4 w-4 mr-1" />
              PNG
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
