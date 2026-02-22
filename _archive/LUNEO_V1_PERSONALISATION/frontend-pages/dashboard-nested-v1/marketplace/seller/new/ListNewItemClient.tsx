'use client';

import React, { useState, useRef } from 'react';
import Link from 'next/link';
import { ArrowLeft, Save, Upload, X, FileIcon, Loader2, Image as ImageIcon } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { logger } from '@/lib/logger';

const TYPES = [
  'TEMPLATE',
  'DESIGN',
  'MODEL_3D',
  'TEXTURE',
  'ANIMATION',
  'PROMPT_PACK',
];

const CATEGORIES = ['jewelry', 'watches', 'glasses', 'accessories', 'other'];

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function ListNewItemClient() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState('TEMPLATE');
  const [category, setCategory] = useState('');
  const [price, setPrice] = useState('0');
  const [tags, setTags] = useState('');
  const [fileUrl, setFileUrl] = useState('');
  const [fileType, setFileType] = useState('');
  const [fileName, setFileName] = useState('');
  const [fileSize, setFileSize] = useState(0);
  const [previewImageUrl, setPreviewImageUrl] = useState('');
  const [previewFileName, setPreviewFileName] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadingPreview, setUploadingPreview] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const previewInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (file: File) => {
    if (file.size > 100 * 1024 * 1024) {
      alert('File too large (max 100MB)');
      return;
    }
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('/api/marketplace/upload', {
        method: 'POST',
        credentials: 'include',
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || data.error || 'Upload failed');
      setFileUrl(data.url);
      setFileType(data.fileType || file.name.split('.').pop() || '');
      setFileName(file.name);
      setFileSize(file.size);
    } catch (e) {
      logger.error('File upload error', e);
      alert(typeof e === 'object' && e && 'message' in e ? String((e as Error).message) : 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handlePreviewUpload = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Preview must be an image');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      alert('Preview image too large (max 10MB)');
      return;
    }
    setUploadingPreview(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('/api/marketplace/upload', {
        method: 'POST',
        credentials: 'include',
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || data.error || 'Upload failed');
      setPreviewImageUrl(data.url);
      setPreviewFileName(file.name);
    } catch (e) {
      logger.error('Preview upload error', e);
      alert(typeof e === 'object' && e && 'message' in e ? String((e as Error).message) : 'Upload failed');
    } finally {
      setUploadingPreview(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch('/api/marketplace', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          description: description || undefined,
          type,
          category: category || undefined,
          tags: tags ? tags.split(',').map(t => t.trim()).filter(Boolean) : undefined,
          price: parseFloat(price) || 0,
          currency: 'CHF',
          fileUrl: fileUrl || undefined,
          fileType: fileType || undefined,
          previewImages: previewImageUrl ? [previewImageUrl] : [],
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || 'Failed to create');
      setDone(true);
    } catch (e) {
      logger.error('Create marketplace item error', e);
      alert(typeof e === 'object' && e && 'message' in e ? String((e as Error).message) : 'Failed to create');
    } finally {
      setSubmitting(false);
    }
  };

  if (done) {
    return (
      <div className="p-6 max-w-2xl">
        <Card className="border-white/10 bg-white/5">
          <CardContent className="py-12 text-center">
            <p className="text-white font-medium">Item listed successfully.</p>
            <Link href="/dashboard/marketplace/seller">
              <Button className="mt-4 bg-purple-600 hover:bg-purple-700">Back to Seller dashboard</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6 max-w-2xl">
      <div className="flex items-center gap-3">
        <Link href="/dashboard/marketplace/seller">
          <Button variant="ghost" size="icon" className="text-white/70 hover:text-white">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <h1 className="text-2xl font-bold text-white">List new item</h1>
      </div>

      <Card className="border-white/10 bg-white/5">
        <CardHeader>
          <CardTitle className="text-white">Item details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="title" className="text-white/80">Title</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                className="mt-1 bg-white/5 border-white/10 text-white"
              />
            </div>
            <div>
              <Label htmlFor="description" className="text-white/80">Description (optional)</Label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="mt-1 w-full rounded-md bg-white/5 border border-white/10 text-white px-3 py-2"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-white/80">Type</Label>
                <Select value={type} onValueChange={setType}>
                  <SelectTrigger className="mt-1 bg-white/5 border-white/10 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TYPES.map((t) => (
                      <SelectItem key={t} value={t}>{t.replace('_', ' ')}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-white/80">Category (optional)</Label>
                <Select value={category || 'none'} onValueChange={(v) => setCategory(v === 'none' ? '' : v)}>
                  <SelectTrigger className="mt-1 bg-white/5 border-white/10 text-white">
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">--</SelectItem>
                    {CATEGORIES.map((c) => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="tags" className="text-white/80">Tags (comma separated, optional)</Label>
              <Input
                id="tags"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="luxury, gold, ring..."
                className="mt-1 bg-white/5 border-white/10 text-white"
              />
            </div>

            <div>
              <Label htmlFor="price" className="text-white/80">Price (CHF) - 0 for free</Label>
              <Input
                id="price"
                type="number"
                min="0"
                step="0.01"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="mt-1 bg-white/5 border-white/10 text-white"
              />
            </div>

            {/* File Upload */}
            <div>
              <Label className="text-white/80">File (template, design, 3D model...)</Label>
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleFileUpload(f);
                }}
              />
              {fileUrl ? (
                <div className="mt-2 flex items-center gap-3 p-3 rounded-lg bg-white/5 border border-white/10">
                  <FileIcon className="w-5 h-5 text-purple-400 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white truncate">{fileName || 'Uploaded file'}</p>
                    <p className="text-xs text-white/50">
                      {fileSize > 0 ? formatFileSize(fileSize) : ''} 
                      {fileType ? ` - .${fileType}` : ''}
                    </p>
                  </div>
                  <Badge variant="outline" className="bg-green-500/10 text-green-400 border-green-500/20 text-xs flex-shrink-0">
                    Uploaded
                  </Badge>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="text-white/50 hover:text-red-400 flex-shrink-0"
                    onClick={() => {
                      setFileUrl('');
                      setFileName('');
                      setFileSize(0);
                      setFileType('');
                    }}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  disabled={uploading}
                  className="mt-2 w-full border-dashed border-white/20 text-white/60 hover:text-white hover:border-purple-500 py-8"
                  onClick={() => fileInputRef.current?.click()}
                >
                  {uploading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4 mr-2" /> Click to upload file (max 100MB)
                    </>
                  )}
                </Button>
              )}
              {/* Fallback URL input */}
              {!fileUrl && !uploading && (
                <div className="mt-2">
                  <p className="text-xs text-white/40 mb-1">Or provide a direct URL:</p>
                  <Input
                    type="url"
                    value={fileUrl}
                    onChange={(e) => setFileUrl(e.target.value)}
                    placeholder="https://..."
                    className="bg-white/5 border-white/10 text-white text-sm"
                  />
                </div>
              )}
            </div>

            {/* Preview Image Upload */}
            <div>
              <Label className="text-white/80">Preview image (optional)</Label>
              <input
                ref={previewInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handlePreviewUpload(f);
                }}
              />
              {previewImageUrl ? (
                <div className="mt-2 flex items-center gap-3 p-3 rounded-lg bg-white/5 border border-white/10">
                  <ImageIcon className="w-5 h-5 text-blue-400 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white truncate">{previewFileName || 'Preview image'}</p>
                  </div>
                  <Badge variant="outline" className="bg-green-500/10 text-green-400 border-green-500/20 text-xs flex-shrink-0">
                    Uploaded
                  </Badge>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="text-white/50 hover:text-red-400 flex-shrink-0"
                    onClick={() => {
                      setPreviewImageUrl('');
                      setPreviewFileName('');
                    }}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  disabled={uploadingPreview}
                  className="mt-2 w-full border-dashed border-white/20 text-white/60 hover:text-white hover:border-blue-500 py-6"
                  onClick={() => previewInputRef.current?.click()}
                >
                  {uploadingPreview ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Uploading preview...
                    </>
                  ) : (
                    <>
                      <ImageIcon className="w-4 h-4 mr-2" /> Upload preview image
                    </>
                  )}
                </Button>
              )}
            </div>

            <div className="flex gap-2 pt-4">
              <Button type="submit" disabled={submitting || uploading || uploadingPreview} className="bg-purple-600 hover:bg-purple-700">
                <Save className="w-4 h-4 mr-2" />
                {submitting ? 'Creating...' : 'List item'}
              </Button>
              <Link href="/dashboard/marketplace/seller">
                <Button type="button" variant="outline" className="border-white/20 text-white">Cancel</Button>
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
