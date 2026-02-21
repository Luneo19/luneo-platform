'use client';

import { useState } from 'react';
import Konva from 'konva';
import { Download, FileImage, FileText, Printer, Code } from 'lucide-react';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { useExport } from '@/hooks/customizer/useExport';
import { useToast } from '@/hooks/use-toast';

interface ExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  stageRef?: Konva.Stage | null;
  sessionId?: string;
}

/**
 * ExportDialog - Export options dialog
 */
export function ExportDialog({ open, onOpenChange, stageRef, sessionId }: ExportDialogProps) {
  const { toast } = useToast();
  const { exportImage, exportPDF, exportSVG, exportPrint, isExporting, exportProgress } = useExport({
    stageRef: stageRef || null,
    sessionId,
  });

  const [activeTab, setActiveTab] = useState<'image' | 'pdf' | 'print' | 'svg'>('image');
  
  // Image export options
  const [imageFormat, setImageFormat] = useState<'png' | 'jpeg' | 'webp'>('png');
  const [imageQuality, setImageQuality] = useState(90);
  const [imageWidth, setImageWidth] = useState('');
  const [imageHeight, setImageHeight] = useState('');
  const [imageBackground, setImageBackground] = useState(true);

  // PDF export options
  const [pdfFormat, setPdfFormat] = useState<'A4' | 'A3' | 'LETTER' | 'CUSTOM'>('A4');
  const [pdfOrientation, setPdfOrientation] = useState<'portrait' | 'landscape'>('portrait');
  const [pdfMargin, setPdfMargin] = useState(10);

  // Print export options
  const [printDpi, setPrintDpi] = useState(300);
  const [printColorProfile, setPrintColorProfile] = useState('RGB');
  const [printBleed, setPrintBleed] = useState(0);
  const [printCropMarks, setPrintCropMarks] = useState(false);

  const handleExport = async () => {
    try {
      switch (activeTab) {
        case 'image':
          await exportImage({
            format: imageFormat,
            quality: imageQuality,
            width: imageWidth ? Number(imageWidth) : undefined,
            height: imageHeight ? Number(imageHeight) : undefined,
          });
          break;
        case 'pdf':
          await exportPDF({
            format: pdfFormat,
            orientation: pdfOrientation,
            width: pdfFormat === 'CUSTOM' ? Number(imageWidth) : undefined,
            height: pdfFormat === 'CUSTOM' ? Number(imageHeight) : undefined,
          });
          break;
        case 'print':
          await exportPrint({
            format: pdfFormat,
            orientation: pdfOrientation,
            quality: printDpi >= 600 ? 'high' : printDpi >= 300 ? 'standard' : 'draft',
            colorMode: printColorProfile === 'RGB' ? 'color' : 'grayscale',
          });
          break;
        case 'svg':
          await exportSVG({});
          break;
      }
      
      toast({
        title: 'Export started',
        description: 'Your export is being processed',
      });
      onOpenChange(false);
    } catch (error) {
      toast({
        title: 'Export failed',
        description: 'Failed to export design',
        variant: 'destructive',
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Export Design</DialogTitle>
          <DialogDescription>
            Choose export format and options
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as typeof activeTab)}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="image">
              <FileImage className="h-4 w-4 mr-2" />
              Image
            </TabsTrigger>
            <TabsTrigger value="pdf">
              <FileText className="h-4 w-4 mr-2" />
              PDF
            </TabsTrigger>
            <TabsTrigger value="print">
              <Printer className="h-4 w-4 mr-2" />
              Print
            </TabsTrigger>
            <TabsTrigger value="svg">
              <Code className="h-4 w-4 mr-2" />
              SVG
            </TabsTrigger>
          </TabsList>

          {/* Image Tab */}
          <TabsContent value="image" className="space-y-4">
            <div className="space-y-2">
              <Label>Format</Label>
              <Select value={imageFormat} onValueChange={(value) => setImageFormat(value as typeof imageFormat)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="png">PNG</SelectItem>
                  <SelectItem value="jpeg">JPEG</SelectItem>
                  <SelectItem value="webp">WebP</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Quality</Label>
                <span className="text-sm text-muted-foreground">{imageQuality}%</span>
              </div>
              <Slider
                value={[imageQuality]}
                onValueChange={([value]) => setImageQuality(value)}
                min={1}
                max={100}
                step={1}
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-2">
                <Label>Width (px)</Label>
                <Input
                  type="number"
                  value={imageWidth}
                  onChange={(e) => setImageWidth(e.target.value)}
                  placeholder="Auto"
                />
              </div>
              <div className="space-y-2">
                <Label>Height (px)</Label>
                <Input
                  type="number"
                  value={imageHeight}
                  onChange={(e) => setImageHeight(e.target.value)}
                  placeholder="Auto"
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <Label>Include Background</Label>
              <Switch checked={imageBackground} onCheckedChange={setImageBackground} />
            </div>
          </TabsContent>

          {/* PDF Tab */}
          <TabsContent value="pdf" className="space-y-4">
            <div className="space-y-2">
              <Label>Page Size</Label>
              <Select value={pdfFormat} onValueChange={(value) => setPdfFormat(value as typeof pdfFormat)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="A4">A4</SelectItem>
                  <SelectItem value="A3">A3</SelectItem>
                  <SelectItem value="LETTER">Letter</SelectItem>
                  <SelectItem value="CUSTOM">Custom</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Orientation</Label>
              <Select value={pdfOrientation} onValueChange={(value) => setPdfOrientation(value as typeof pdfOrientation)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="portrait">Portrait</SelectItem>
                  <SelectItem value="landscape">Landscape</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {pdfFormat === 'CUSTOM' && (
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-2">
                  <Label>Width (mm)</Label>
                  <Input
                    type="number"
                    value={imageWidth}
                    onChange={(e) => setImageWidth(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Height (mm)</Label>
                  <Input
                    type="number"
                    value={imageHeight}
                    onChange={(e) => setImageHeight(e.target.value)}
                  />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Margin (mm)</Label>
                <span className="text-sm text-muted-foreground">{pdfMargin}mm</span>
              </div>
              <Slider
                value={[pdfMargin]}
                onValueChange={([value]) => setPdfMargin(value)}
                min={0}
                max={50}
                step={1}
              />
            </div>
          </TabsContent>

          {/* Print Tab */}
          <TabsContent value="print" className="space-y-4">
            <div className="space-y-2">
              <Label>DPI</Label>
              <Select value={printDpi.toString()} onValueChange={(value) => setPrintDpi(Number(value))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="150">150 DPI (Draft)</SelectItem>
                  <SelectItem value="300">300 DPI (Standard)</SelectItem>
                  <SelectItem value="600">600 DPI (High)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Color Profile</Label>
              <Select value={printColorProfile} onValueChange={setPrintColorProfile}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="RGB">RGB</SelectItem>
                  <SelectItem value="CMYK">CMYK</SelectItem>
                  <SelectItem value="Grayscale">Grayscale</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Bleed (mm)</Label>
                <span className="text-sm text-muted-foreground">{printBleed}mm</span>
              </div>
              <Slider
                value={[printBleed]}
                onValueChange={([value]) => setPrintBleed(value)}
                min={0}
                max={10}
                step={0.5}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label>Crop Marks</Label>
              <Switch checked={printCropMarks} onCheckedChange={setPrintCropMarks} />
            </div>
          </TabsContent>

          {/* SVG Tab */}
          <TabsContent value="svg" className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Export as SVG vector format. Perfect for scaling and editing.
            </p>
          </TabsContent>
        </Tabs>

        {/* Export Progress */}
        {isExporting && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>Exporting...</span>
              <span>{exportProgress}%</span>
            </div>
            <Progress value={exportProgress} />
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isExporting}>
            Cancel
          </Button>
          <Button onClick={handleExport} disabled={isExporting}>
            <Download className="h-4 w-4 mr-2" />
            {isExporting ? 'Exporting...' : 'Export'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
