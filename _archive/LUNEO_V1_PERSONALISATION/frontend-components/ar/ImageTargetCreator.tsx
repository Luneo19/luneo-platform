'use client';

import React, { useCallback, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Upload, Link2, AlertCircle } from 'lucide-react';
import { logger } from '@/lib/logger';
import Image from 'next/image';

export interface ImageTargetCreatorProps {
  projectId: string | null;
  onUpload?: (targetId: string) => void;
  onAnalyze?: (targetId: string, score: number) => void;
  onLinkModel?: (targetId: string, modelId: string) => void;
  className?: string;
}

export interface QualityResult {
  qualityScore: number;
  trackingQuality: string;
  issues?: string[];
  recommendations?: string[];
}

export function ImageTargetCreator({
  projectId,
  onUpload,
  onAnalyze,
  onLinkModel,
  className,
}: ImageTargetCreatorProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [quality, setQuality] = useState<QualityResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [widthCm, setWidthCm] = useState<string>('10');
  const [heightCm, setHeightCm] = useState<string>('10');
  const [targetId, setTargetId] = useState<string | null>(null);

  const handleFileSelect = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file || !projectId) return;
      setError(null);
      setQuality(null);
      setPreviewUrl(URL.createObjectURL(file));
      setLoading(true);
      try {
        const { endpoints } = await import('@/lib/api/client');
        const formData = new FormData();
        formData.append('file', file);
        const res = await endpoints.ar.projects.targets.create(projectId, formData) as { id?: string };
        const id = res?.id ?? (res as { data?: { id?: string } }).data?.id;
        if (id) {
          setTargetId(id);
          onUpload?.(id);
          const analyzeRes = await endpoints.ar.projects.targets.analyze(projectId, id) as QualityResult;
          setQuality(analyzeRes);
          onAnalyze?.(id, analyzeRes.qualityScore);
        }
      } catch (err) {
        logger.error('ImageTargetCreator: upload/analyze failed', { error: err });
        setError(err instanceof Error ? err.message : 'Upload failed');
      } finally {
        setLoading(false);
      }
    },
    [projectId, onUpload, onAnalyze]
  );

  const scoreColor = quality
    ? quality.qualityScore >= 80
      ? 'text-green-600'
      : quality.qualityScore >= 50
        ? 'text-amber-600'
        : 'text-red-600'
    : '';

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Image target</CardTitle>
        <CardDescription>Upload an image to use as an AR tracking target. Link a 3D model to show when the target is detected.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div
          role="button"
          tabIndex={0}
          onClick={() => !loading && projectId && inputRef.current?.click()}
          onKeyDown={(e) => e.key === 'Enter' && inputRef.current?.click()}
          className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:border-primary/50 transition-colors"
          aria-label="Upload target image"
        >
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileSelect}
            aria-hidden
          />
          {previewUrl ? (
            <div className="space-y-2">
              <Image src={previewUrl} alt="Target preview" className="max-h-48 mx-auto rounded object-contain" width={200} height={200} unoptimized />
              {loading && <p className="text-sm text-muted-foreground">Analyzing…</p>}
            </div>
          ) : (
            <>
              <Upload className="h-10 w-10 mx-auto text-muted-foreground mb-2" aria-hidden />
              <p className="text-sm font-medium">Click or drop image</p>
            </>
          )}
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {quality && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Quality score</Label>
              <span className={`font-semibold ${scoreColor}`}>{quality.qualityScore}/100</span>
            </div>
            {quality.issues && quality.issues.length > 0 && (
              <ul className="text-sm text-muted-foreground list-disc list-inside">
                {quality.issues.map((issue, i) => (
                  <li key={i}>{issue}</li>
                ))}
              </ul>
            )}
            {quality.recommendations && quality.recommendations.length > 0 && (
              <p className="text-sm text-muted-foreground">Recommendations: {quality.recommendations.join('; ')}</p>
            )}
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="width-cm">Width (cm)</Label>
            <Input
              id="width-cm"
              type="number"
              min={1}
              step={0.1}
              value={widthCm}
              onChange={(e) => setWidthCm(e.target.value)}
              aria-label="Physical width in cm"
            />
          </div>
          <div>
            <Label htmlFor="height-cm">Height (cm)</Label>
            <Input
              id="height-cm"
              type="number"
              min={1}
              step={0.1}
              value={heightCm}
              onChange={(e) => setHeightCm(e.target.value)}
              aria-label="Physical height in cm"
            />
          </div>
        </div>

        {targetId && (
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="gap-2" aria-label="Link 3D model to target">
              <Link2 className="h-4 w-4" />
              Link 3D model
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
