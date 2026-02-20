'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Image as ImageIcon, Upload, Link, X } from 'lucide-react';
import { useImage } from '@/hooks/customizer';
import { ScrollArea } from '@/components/ui/scroll-area';
import Image from 'next/image';

/**
 * ImageTool - Image tool panel with upload, URL input, and recent images
 */
export function ImageTool() {
  const [imageUrl, setImageUrl] = useState('');
  const [recentImages, setRecentImages] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { uploadImage, addImage } = useImage();

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const url = await uploadImage(file);
      setRecentImages((prev) => [url, ...prev.slice(0, 9)]);
    } catch (error) {
      console.error('Failed to upload image:', error);
    }
  };

  const handleUrlSubmit = async () => {
    if (!imageUrl.trim()) return;

    try {
      await addImage(imageUrl);
      setRecentImages((prev) => [imageUrl, ...prev.slice(0, 9)]);
      setImageUrl('');
    } catch (error) {
      console.error('Failed to add image from URL:', error);
    }
  };

  const handleRecentImageClick = async (url: string) => {
    try {
      await addImage(url);
    } catch (error) {
      console.error('Failed to add image:', error);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <ImageIcon className="h-5 w-5" />
          <CardTitle>Image Tool</CardTitle>
        </div>
        <CardDescription>Upload or add images from URL</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Upload Button */}
        <div className="space-y-2">
          <Button
            onClick={() => fileInputRef.current?.click()}
            className="w-full"
            variant="outline"
          >
            <Upload className="mr-2 h-4 w-4" />
            Upload Image
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileUpload}
            className="hidden"
          />
        </div>

        <Separator />

        {/* URL Input */}
        <div className="space-y-2">
          <Label>Image URL</Label>
          <div className="flex gap-2">
            <Input
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="https://example.com/image.jpg"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleUrlSubmit();
                }
              }}
            />
            <Button onClick={handleUrlSubmit} size="icon">
              <Link className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Recent Images */}
        {recentImages.length > 0 && (
          <>
            <Separator />
            <div className="space-y-2">
              <Label>Recent Images</Label>
              <ScrollArea className="h-48">
                <div className="grid grid-cols-3 gap-2">
                  {recentImages.map((url, index) => (
                    <div
                      key={index}
                      className="group relative aspect-square cursor-pointer overflow-hidden rounded border"
                      onClick={() => handleRecentImageClick(url)}
                    >
                      <Image width={200} height={200}
                        src={url}
                        alt={`Recent ${index + 1}`}
                        className="h-full w-full object-cover transition-opacity group-hover:opacity-75"
                      unoptimized />
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setRecentImages((prev) => prev.filter((_, i) => i !== index));
                        }}
                        className="absolute right-1 top-1 rounded bg-background/80 p-1 opacity-0 transition-opacity group-hover:opacity-100"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
