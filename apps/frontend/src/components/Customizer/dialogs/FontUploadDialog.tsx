'use client';

import { useState, useCallback } from 'react';
import { Upload, Type, X } from 'lucide-react';
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
import { useFonts } from '@/hooks/customizer/useFonts';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface FontUploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const ACCEPTED_FONT_TYPES = ['.ttf', '.otf', '.woff', '.woff2'];

/**
 * FontUploadDialog - Font upload dialog
 */
export function FontUploadDialog({ open, onOpenChange }: FontUploadDialogProps) {
  const { toast } = useToast();
  const { loadFont } = useFonts();
  
  const [fontFile, setFontFile] = useState<File | null>(null);
  const [fontName, setFontName] = useState('');
  const [previewText, setPreviewText] = useState('The quick brown fox jumps over the lazy dog');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleFileSelect = useCallback((file: File) => {
    const extension = '.' + file.name.split('.').pop()?.toLowerCase();
    if (!ACCEPTED_FONT_TYPES.includes(extension)) {
      toast({
        title: 'Invalid file type',
        description: `Please select a font file (${ACCEPTED_FONT_TYPES.join(', ')})`,
        variant: 'destructive',
      });
      return;
    }

    setFontFile(file);
    if (!fontName) {
      // Extract font name from filename
      const name = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
      setFontName(name);
    }
    
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
  }, [fontName, toast]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileSelect(file);
    }
  }, [handleFileSelect]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  }, [handleFileSelect]);

  const handleUpload = async () => {
    if (!fontFile || !fontName) {
      toast({
        title: 'Missing information',
        description: 'Please provide a font file and name',
        variant: 'destructive',
      });
      return;
    }

    try {
      // In a real implementation, you would upload the font file to the server
      // and then load it using loadFont
      const fontUrl = previewUrl || URL.createObjectURL(fontFile);
      await loadFont(fontName, fontUrl);
      
      toast({
        title: 'Font uploaded',
        description: `${fontName} has been uploaded and loaded`,
      });
      handleClose();
    } catch (error) {
      toast({
        title: 'Upload failed',
        description: 'Failed to upload font',
        variant: 'destructive',
      });
    }
  };

  const handleClose = () => {
    setFontFile(null);
    setFontName('');
    setPreviewText('The quick brown fox jumps over the lazy dog');
    setPreviewUrl(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Upload Font</DialogTitle>
          <DialogDescription>
            Upload a custom font file (.ttf, .otf, .woff, .woff2)
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Drag & Drop Area */}
          <div
            className={cn(
              'border-2 border-dashed rounded-lg p-6 text-center transition-colors',
              isDragging ? 'border-primary bg-primary/5' : 'border-muted-foreground/25'
            )}
            onDrop={handleDrop}
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
          >
            {fontFile ? (
              <div className="space-y-2">
                <Type className="h-8 w-8 mx-auto text-primary" />
                <p className="text-sm font-medium">{fontFile.name}</p>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setFontFile(null);
                    setPreviewUrl(null);
                  }}
                >
                  <X className="h-4 w-4 mr-2" />
                  Remove
                </Button>
              </div>
            ) : (
              <>
                <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                <p className="text-sm text-muted-foreground mb-2">
                  Drag and drop a font file here
                </p>
                <input
                  type="file"
                  accept={ACCEPTED_FONT_TYPES.join(',')}
                  onChange={handleFileInput}
                  className="hidden"
                  id="font-upload-input"
                />
                <Button variant="outline" size="sm" asChild>
                  <label htmlFor="font-upload-input" className="cursor-pointer">
                    Choose File
                  </label>
                </Button>
              </>
            )}
          </div>

          {/* Font Name */}
          <div className="space-y-2">
            <Label>Font Name</Label>
            <Input
              value={fontName}
              onChange={(e) => setFontName(e.target.value)}
              placeholder="My Custom Font"
            />
          </div>

          {/* Preview Text */}
          <div className="space-y-2">
            <Label>Preview Text</Label>
            <Input
              value={previewText}
              onChange={(e) => setPreviewText(e.target.value)}
              placeholder="The quick brown fox..."
            />
          </div>

          {/* Font Preview */}
          {previewUrl && fontName && (
            <div className="space-y-2">
              <Label>Preview</Label>
              <div className="p-4 border rounded-lg bg-muted/50">
                <div
                  style={{
                    fontFamily: fontName,
                    fontSize: '24px',
                  }}
                  className="text-center"
                >
                  {previewText || 'Preview'}
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button onClick={handleUpload} disabled={!fontFile || !fontName}>
            Upload
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
