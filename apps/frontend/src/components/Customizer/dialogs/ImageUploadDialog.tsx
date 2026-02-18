'use client';

import { useState, useCallback } from 'react';
import { Upload, X, Link as LinkIcon, Image as ImageIcon } from 'lucide-react';
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
import { Progress } from '@/components/ui/progress';
import { useImage } from '@/hooks/customizer/useImage';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface ImageUploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * ImageUploadDialog - Full image upload dialog
 */
export function ImageUploadDialog({ open, onOpenChange }: ImageUploadDialogProps) {
  const { toast } = useToast();
  const { uploadImage, addImage, isUploading, uploadProgress } = useImage();
  
  const [imageUrl, setImageUrl] = useState('');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleFileSelect = useCallback((selectedFile: File) => {
    if (!selectedFile.type.startsWith('image/')) {
      toast({
        title: 'Invalid file',
        description: 'Please select an image file',
        variant: 'destructive',
      });
      return;
    }

    setFile(selectedFile);
    const url = URL.createObjectURL(selectedFile);
    setPreviewUrl(url);
  }, [toast]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      handleFileSelect(droppedFile);
    }
  }, [handleFileSelect]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      handleFileSelect(selectedFile);
    }
  }, [handleFileSelect]);

  const handleUpload = useCallback(async () => {
    if (file) {
      try {
        await uploadImage(file);
        toast({
          title: 'Image uploaded',
          description: 'Image has been uploaded successfully',
        });
        handleClose();
      } catch (error) {
        toast({
          title: 'Upload failed',
          description: 'Failed to upload image',
          variant: 'destructive',
        });
      }
    } else if (imageUrl) {
      try {
        await addImage(imageUrl);
        toast({
          title: 'Image added',
          description: 'Image has been added from URL',
        });
        handleClose();
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Failed to add image from URL',
          variant: 'destructive',
        });
      }
    }
  }, [file, imageUrl, uploadImage, addImage, toast]);

  const handleClose = () => {
    setFile(null);
    setImageUrl('');
    setPreviewUrl(null);
    onOpenChange(false);
  };

  const getFileInfo = () => {
    if (!file) return null;
    return {
      name: file.name,
      size: (file.size / 1024 / 1024).toFixed(2) + ' MB',
    };
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Upload Image</DialogTitle>
          <DialogDescription>
            Upload an image from your computer or paste an image URL
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Drag & Drop Area */}
          <div
            className={cn(
              'border-2 border-dashed rounded-lg p-8 text-center transition-colors',
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
            {previewUrl ? (
              <div className="relative">
                <img
                  src={previewUrl}
                  alt="Preview"
                  className="max-h-64 mx-auto rounded"
                />
                <Button
                  variant="destructive"
                  size="icon"
                  className="absolute top-2 right-2"
                  onClick={() => {
                    setFile(null);
                    setPreviewUrl(null);
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <>
                <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-sm text-muted-foreground mb-2">
                  Drag and drop an image here
                </p>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileInput}
                  className="hidden"
                  id="image-upload-input"
                />
                <Button variant="outline" size="sm" asChild>
                  <label htmlFor="image-upload-input" className="cursor-pointer">
                    Choose File
                  </label>
                </Button>
              </>
            )}
          </div>

          {/* File Info */}
          {file && (
            <div className="text-sm space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">File:</span>
                <span className="font-medium">{getFileInfo()?.name}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Size:</span>
                <span className="font-medium">{getFileInfo()?.size}</span>
              </div>
            </div>
          )}

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
              <Button
                variant="outline"
                size="icon"
                onClick={async () => {
                  if (imageUrl) {
                    try {
                      const response = await fetch(imageUrl);
                      if (response.ok) {
                        setPreviewUrl(imageUrl);
                      } else {
                        toast({
                          title: 'Invalid URL',
                          description: 'Could not load image from URL',
                          variant: 'destructive',
                        });
                      }
                    } catch {
                      toast({
                        title: 'Invalid URL',
                        description: 'Could not load image from URL',
                        variant: 'destructive',
                      });
                    }
                  }
                }}
              >
                <LinkIcon className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Upload Progress */}
          {isUploading && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Uploading...</span>
                <span>{uploadProgress}%</span>
              </div>
              <Progress value={uploadProgress} />
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isUploading}>
            Cancel
          </Button>
          <Button onClick={handleUpload} disabled={isUploading || (!file && !imageUrl)}>
            {isUploading ? 'Uploading...' : 'Upload'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
