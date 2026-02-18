'use client';

import { useState, useCallback } from 'react';
import { Image, Upload, Link as LinkIcon, Sparkles, Crop, X } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Separator } from '@/components/ui/separator';
import { useImage } from '@/hooks/customizer/useImage';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

/**
 * ImagePanel - Image management panel
 */
export function ImagePanel() {
  const { toast } = useToast();
  const { uploadImage, addImage, removeBackground, applyFilter, isUploading, uploadProgress } = useImage();
  
  const [imageUrl, setImageUrl] = useState('');
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [saturation, setSaturation] = useState(100);
  const [blur, setBlur] = useState(0);
  const [recentImages, setRecentImages] = useState<string[]>([]);
  const [isDragging, setIsDragging] = useState(false);

  const handleFileUpload = useCallback(async (file: File) => {
    try {
      const imageId = await uploadImage(file);
      setRecentImages((prev) => [URL.createObjectURL(file), ...prev.slice(0, 9)]);
      toast({
        title: 'Image uploaded',
        description: 'Image has been uploaded successfully',
      });
    } catch (error) {
      toast({
        title: 'Upload failed',
        description: 'Failed to upload image',
        variant: 'destructive',
      });
    }
  }, [uploadImage, toast]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      handleFileUpload(file);
    }
  }, [handleFileUpload]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
  }, [handleFileUpload]);

  const handleAddFromUrl = useCallback(async () => {
    if (!imageUrl) return;
    try {
      await addImage(imageUrl);
      setRecentImages((prev) => [imageUrl, ...prev.slice(0, 9)]);
      setImageUrl('');
      toast({
        title: 'Image added',
        description: 'Image has been added to the canvas',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to add image from URL',
        variant: 'destructive',
      });
    }
  }, [imageUrl, addImage, toast]);

  const handleRemoveBackground = useCallback(async () => {
    // This would need the selected image ID
    toast({
      title: 'Remove Background',
      description: 'Select an image first to remove its background',
    });
  }, [toast]);

  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Image className="h-5 w-5" />
          <CardTitle>Images</CardTitle>
        </div>
        <CardDescription>Upload and manage images</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Upload Area */}
        <div
          className={cn(
            'border-2 border-dashed rounded-lg p-6 text-center transition-colors',
            isDragging ? 'border-primary bg-primary/5' : 'border-muted-foreground/25',
            isUploading && 'opacity-50'
          )}
          onDrop={handleDrop}
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
        >
          <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
          <p className="text-sm text-muted-foreground mb-2">
            Drag and drop an image here
          </p>
          <input
            type="file"
            accept="image/*"
            onChange={handleFileInput}
            className="hidden"
            id="image-upload"
          />
          <Button variant="outline" size="sm" asChild>
            <label htmlFor="image-upload" className="cursor-pointer">
              Choose File
            </label>
          </Button>
          {isUploading && (
            <div className="mt-2">
              <div className="h-1 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary transition-all"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground mt-1">{uploadProgress}%</p>
            </div>
          )}
        </div>

        {/* URL Input */}
        <div className="space-y-2">
          <Label>Or paste image URL</Label>
          <div className="flex gap-2">
            <Input
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="https://example.com/image.jpg"
              className="flex-1"
            />
            <Button onClick={handleAddFromUrl} size="icon">
              <LinkIcon className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <Separator />

        {/* Recent Uploads */}
        {recentImages.length > 0 && (
          <div className="space-y-2">
            <Label>Recent Uploads</Label>
            <div className="grid grid-cols-3 gap-2">
              {recentImages.map((url, index) => (
                <div
                  key={index}
                  className="relative aspect-square rounded border overflow-hidden cursor-pointer hover:opacity-80 transition-opacity"
                  onClick={() => addImage(url)}
                >
                  <img src={url} alt={`Recent ${index + 1}`} className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          </div>
        )}

        <Separator />

        {/* Filters */}
        <div className="space-y-4">
          <Label>Filters</Label>
          
          {/* Brightness */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-sm">Brightness</Label>
              <span className="text-sm text-muted-foreground">{brightness}%</span>
            </div>
            <Slider
              value={[brightness]}
              onValueChange={([value]) => setBrightness(value)}
              min={0}
              max={200}
              step={1}
            />
          </div>

          {/* Contrast */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-sm">Contrast</Label>
              <span className="text-sm text-muted-foreground">{contrast}%</span>
            </div>
            <Slider
              value={[contrast]}
              onValueChange={([value]) => setContrast(value)}
              min={0}
              max={200}
              step={1}
            />
          </div>

          {/* Saturation */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-sm">Saturation</Label>
              <span className="text-sm text-muted-foreground">{saturation}%</span>
            </div>
            <Slider
              value={[saturation]}
              onValueChange={([value]) => setSaturation(value)}
              min={0}
              max={200}
              step={1}
            />
          </div>

          {/* Blur */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-sm">Blur</Label>
              <span className="text-sm text-muted-foreground">{blur}px</span>
            </div>
            <Slider
              value={[blur]}
              onValueChange={([value]) => setBlur(value)}
              min={0}
              max={40}
              step={0.5}
            />
          </div>
        </div>

        <Separator />

        {/* Actions */}
        <div className="flex gap-2">
          <Button
            variant="outline"
            className="flex-1"
            onClick={handleRemoveBackground}
          >
            <Sparkles className="h-4 w-4 mr-2" />
            Remove Background
          </Button>
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => {
              toast({
                title: 'Crop Tool',
                description: 'Select an image to crop it',
              });
            }}
          >
            <Crop className="h-4 w-4 mr-2" />
            Crop
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
