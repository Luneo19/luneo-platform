'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, QrCode, Download, BarChart3, Plus } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useQRCode, type QRCodeItem } from '../../../hooks/useQRCode';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface QRCodesPageClientProps {
  projectId: string;
}

export function QRCodesPageClient({ projectId }: QRCodesPageClientProps) {
  const { toast } = useToast();
  const { list, loading, error, refetch, create, download } = useQRCode(projectId);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [url, setUrl] = useState('');
  const [fgColor, setFgColor] = useState('#000000');
  const [bgColor, setBgColor] = useState('#ffffff');
  const [style, setStyle] = useState('square');
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const handleCreate = async () => {
    if (!url.trim()) return;
    try {
      await create(url.trim(), { fgColor, bgColor, style });
      toast({ title: 'QR code créé' });
      setUrl('');
      setDialogOpen(false);
    } catch (err) {
      toast({ title: 'Erreur', description: (err as Error).message, variant: 'destructive' });
    }
  };

  const handleDownload = async (item: QRCodeItem, format: 'png' | 'svg' | 'pdf') => {
    setDownloadingId(item.id);
    try {
      const blob = await download(item.id, format);
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `qr-${item.id}.${format}`;
      a.click();
      URL.revokeObjectURL(a.href);
      toast({ title: 'Téléchargement démarré' });
    } catch (err) {
      toast({ title: 'Erreur', description: (err as Error).message, variant: 'destructive' });
    } finally {
      setDownloadingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild>
            <Link href={`/dashboard/ar-studio/projects/${projectId}`}>
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-xl font-semibold text-white">QR codes</h1>
            <p className="text-sm text-white/60">Générer et suivre les scans</p>
          </div>
        </div>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Générer un QR
        </Button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-44 rounded-xl w-full" />
          ))}
        </div>
      ) : error ? (
        <Card className="border-red-500/30 bg-red-500/10 p-6">
          <p className="text-red-400">{error.message}</p>
          <Button variant="outline" className="mt-4" onClick={() => refetch()}>
            Réessayer
          </Button>
        </Card>
      ) : list.length === 0 ? (
        <Card className="border-white/10 bg-white/5 p-12 text-center">
          <QrCode className="h-12 w-12 mx-auto text-white/40 mb-4" />
          <p className="text-white/80 mb-2">Aucun QR code</p>
          <p className="text-sm text-white/50 mb-4">Générez un QR code pour rediriger vers votre expérience AR.</p>
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Générer un QR code
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {list.map((item) => (
            <Card key={item.id} className="border-white/10 bg-white/5 overflow-hidden">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-white/60 truncate max-w-[180px]" title={item.url}>
                    {item.url}
                  </p>
                  {item.scanCount != null && (
                    <Badge variant="secondary" className="flex items-center gap-1">
                      <BarChart3 className="h-3 w-3" />
                      {item.scanCount}
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex justify-center mb-3">
                  {item.imageUrl ? (
                    <img src={item.imageUrl} alt="QR" className="h-32 w-32 object-contain bg-white rounded" />
                  ) : (
                    <div className="h-32 w-32 bg-white/10 rounded flex items-center justify-center">
                      <QrCode className="h-12 w-12 text-white/40" />
                    </div>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDownload(item, 'png')}
                    disabled={downloadingId === item.id}
                  >
                    <Download className="h-3 w-3 mr-1" />
                    PNG
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDownload(item, 'svg')}
                    disabled={downloadingId === item.id}
                  >
                    SVG
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDownload(item, 'pdf')}
                    disabled={downloadingId === item.id}
                  >
                    PDF
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nouveau QR code</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>URL de destination</Label>
              <Input
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://..."
                className="mt-1 bg-white/5 border-white/20 text-white"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Couleur avant-plan</Label>
                <div className="flex gap-2 mt-1">
                  <input
                    type="color"
                    value={fgColor}
                    onChange={(e) => setFgColor(e.target.value)}
                    className="h-9 w-12 rounded border border-white/20 cursor-pointer"
                  />
                  <Input
                    value={fgColor}
                    onChange={(e) => setFgColor(e.target.value)}
                    className="bg-white/5 border-white/20 text-white flex-1"
                  />
                </div>
              </div>
              <div>
                <Label>Couleur arrière-plan</Label>
                <div className="flex gap-2 mt-1">
                  <input
                    type="color"
                    value={bgColor}
                    onChange={(e) => setBgColor(e.target.value)}
                    className="h-9 w-12 rounded border border-white/20 cursor-pointer"
                  />
                  <Input
                    value={bgColor}
                    onChange={(e) => setBgColor(e.target.value)}
                    className="bg-white/5 border-white/20 text-white flex-1"
                  />
                </div>
              </div>
            </div>
            <div>
              <Label>Style</Label>
              <Select value={style} onValueChange={setStyle}>
                <SelectTrigger className="mt-1 bg-white/5 border-white/20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="square">Carré</SelectItem>
                  <SelectItem value="rounded">Arrondi</SelectItem>
                  <SelectItem value="dots">Points</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDialogOpen(false)}>
              Annuler
            </Button>
            <Button onClick={handleCreate} disabled={!url.trim()}>
              Générer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
