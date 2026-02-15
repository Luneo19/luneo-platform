'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { 
  Sparkles, Lock, AlertCircle, ArrowLeft, Download, Eye, Share2, ArrowRight 
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { api } from '@/lib/api/client';
import { logger } from '@/lib/logger';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { memo } from 'react';

interface SharedDesign {
  id: string;
  design_id: string;
  title: string;
  description: string | null;
  allow_download: boolean;
  allow_ar_view: boolean;
  show_branding: boolean;
  custom_message: string | null;
  view_count: number;
  design: {
    id: string;
    prompt: string;
    preview_url: string;
    generated_image_url: string;
    style: string;
    created_at: string;
  };
}

function SharePageContent() {
  const params = useParams();
  const router = useRouter();
  const token = params.token as string;

  const [share, setShare] = useState<SharedDesign | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [requiresPassword, setRequiresPassword] = useState(false);
  const [password, setPassword] = useState('');
  const [passwordError, setPasswordError] = useState<string | null>(null);

  const loadShare = useCallback(async (pwd?: string) => {
    try {
      const result = await api.get<{ success: boolean; data?: SharedDesign; requires_password?: boolean; error?: string }>(
        `/api/v1/share/${token}`,
        pwd ? { params: { password: pwd } } : undefined
      );

      if (!result.success) {
        if (result.requires_password) {
          setRequiresPassword(true);
          if (pwd) {
            setPasswordError('Mot de passe incorrect');
          }
        } else {
          setError(result.error || 'Erreur de chargement');
        }
        return;
      }

      if (result.data) setShare(result.data);
      setRequiresPassword(false);
      setPasswordError(null);
    } catch (err: unknown) {
      setError('Erreur de connexion');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    void loadShare();
  }, [loadShare]);

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password) {
      loadShare(password);
    }
  };

  const handleDownload = async () => {
    if (!share?.allow_download) return;

    try {
      await api.post(`/api/v1/share/${token}/action`, { action_type: 'download' });

      // Download image
      const link = document.createElement('a');
      link.href = share.design.preview_url;
      link.download = `${share.title}.png`;
      link.click();
    } catch (err) {
      logger.error('Download error', {
        error: err,
        token,
        designId: share?.design_id,
        message: err instanceof Error ? err.message : 'Unknown error',
      });
    }
  };

  const handleARLaunch = async () => {
    if (!share?.allow_ar_view) return;

    try {
      // Track AR launch action
      await api.post(`/api/v1/share/${token}/action`, { action_type: 'ar_launch' });

      // Try to open the design image in AR via the native AR Quick Look (iOS) or Scene Viewer (Android)
      const imageUrl = share.design?.generated_image_url || share.design?.preview_url;
      if (imageUrl) {
        // Open AR experience by navigating to the image with AR intent
        const arLink = document.createElement('a');
        arLink.setAttribute('rel', 'ar');
        arLink.href = imageUrl;
        arLink.click();
      }
    } catch (err) {
      logger.error('AR launch error', {
        error: err,
        token,
        designId: share?.design_id,
        message: err instanceof Error ? err.message : 'Unknown error',
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <Sparkles className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }

  if (requiresPassword) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 flex items-center justify-center p-6">
        <Card className="max-w-md w-full p-6 sm:p-8 bg-white/90 backdrop-blur-sm">
          <div className="text-center mb-6">
            <Lock className="w-12 h-12 text-blue-600 mx-auto mb-4" />
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">Contenu protégé</h1>
            <p className="text-gray-600">Ce design est protégé par un mot de passe</p>
          </div>
          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <div>
              <Input
                type="password"
                placeholder="Entrez le mot de passe"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full"
              />
              {passwordError && <p className="text-sm text-red-600 mt-2">{passwordError}</p>}
            </div>
            <Button type="submit" className="w-full">
              Déverrouiller
            </Button>
          </form>
        </Card>
      </div>
    );
  }

  if (error || !share) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 flex items-center justify-center p-6">
        <Card className="max-w-md w-full p-6 sm:p-8 bg-white/90 backdrop-blur-sm text-center">
          <AlertCircle className="w-12 h-12 text-red-600 mx-auto mb-4" />
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">Erreur</h1>
          <p className="text-gray-600 mb-6">{error || 'Design non trouvé'}</p>
          <Button onClick={() => router.push('/')} variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour à l'accueil
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 py-4">
          <div className="flex items-center justify-between">
            <Button variant="ghost" onClick={() => router.push('/')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Retour
            </Button>
            {share.show_branding && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">Créé avec</span>
                <span className="text-lg font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Luneo
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 md:px-8 py-8 sm:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
          {/* Left - Design Preview */}
          <div>
            <Card className="p-4 sm:p-6 bg-white/90 backdrop-blur-sm">
              <div className="aspect-square relative bg-gray-100 rounded-lg overflow-hidden mb-4">
                <Image
                  src={share.design.preview_url || share.design.generated_image_url}
                  alt={share.title}
                  fill
                  className="object-contain"
                />
              </div>
              <div className="flex items-center justify-center gap-3">
                <span className="text-sm text-gray-500">
                  {share.view_count} vue{share.view_count > 1 ? 's' : ''}
                </span>
              </div>
            </Card>
          </div>

          {/* Right - Info & Actions */}
          <div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              {share.title}
            </h1>

            {share.description && (
              <p className="text-base sm:text-lg text-gray-600 mb-6">{share.description}</p>
            )}

            {share.custom_message && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <p className="text-sm text-blue-900">{share.custom_message}</p>
              </div>
            )}

            <div className="space-y-4 mb-8">
              <div className="flex items-center gap-3 text-sm text-gray-600">
                <Sparkles className="w-5 h-5 text-blue-600" />
                <span>Style: {share.design.style}</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-gray-600">
                <Eye className="w-5 h-5 text-purple-600" />
                <span>Créé le {new Date(share.design.created_at).toLocaleDateString('fr-FR')}</span>
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-3">
              {share.allow_download && (
                <Button
                  onClick={handleDownload}
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
                >
                  <Download className="w-5 h-5 mr-2" />
                  Télécharger
                </Button>
              )}

              {share.allow_ar_view && (
                <Button
                  onClick={handleARLaunch}
                  variant="outline"
                  className="w-full"
                >
                  <Eye className="w-5 h-5 mr-2" />
                  Voir en AR
                </Button>
              )}

              <Button variant="outline" className="w-full">
                <Share2 className="w-5 h-5 mr-2" />
                Partager
              </Button>
            </div>

            {/* CTA */}
            <div className="mt-8 p-6 bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl border border-blue-200">
              <h3 className="font-bold text-gray-900 mb-2">Créez vos propres designs</h3>
              <p className="text-sm text-gray-600 mb-4">
                Utilisez l'IA pour générer des designs uniques en quelques secondes
              </p>
              <Link href="/register">
                <Button className="w-full bg-gradient-to-r from-blue-600 to-purple-600">
                  Essayer gratuitement
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const SharePageContentMemo = memo(SharePageContent);

export default function SharePage() {
  return (
    <ErrorBoundary componentName="SharePage">
      <SharePageContentMemo />
    </ErrorBoundary>
  );
}
