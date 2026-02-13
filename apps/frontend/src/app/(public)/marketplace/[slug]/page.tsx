'use client';

/**
 * Template Detail Page
 * MK-005: Preview de templates avec système de reviews
 */

import React, { useState, useMemo, useCallback, useEffect, memo } from 'react';
import { LazyMotionDiv as motion } from '@/lib/performance/dynamic-motion';
import {
  Star,
  Download,
  Heart,
  Share2,
  ShoppingCart,
  Check,
  ChevronLeft,
  ChevronRight,
  Eye,
  Tag,
  FileText,
  User,
  ThumbsUp,
  Flag,
  Crown,
  Shield,
} from 'lucide-react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import type { Template, Review } from '@/lib/marketplace/types';
import OptimizedImage from '@/components/optimized/OptimizedImage';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { logger } from '@/lib/logger';
import { endpoints } from '@/lib/api/client';
import { useI18n } from '@/i18n/useI18n';

// No mock data in production - show empty state when API fails
const EMPTY_REVIEWS: Review[] = [];

function normalizeApiTemplate(raw: Record<string, unknown>): Template {
  const creatorId = String(raw.creatorId ?? raw.creator_id ?? '');
  const previewImages = Array.isArray(raw.previewImages)
    ? (raw.previewImages as string[])
    : Array.isArray(raw.preview_images)
      ? (raw.preview_images as string[])
      : [];
  const thumb = raw.thumbnailUrl ?? raw.thumbnail_url;
  const previewImage = typeof thumb === 'string' ? thumb : previewImages[0] || '/placeholder-template.svg';
  const toTs = (v: unknown) => (v instanceof Date ? v.getTime() : typeof v === 'string' ? new Date(v).getTime() : Date.now());
  const creator = (raw.creator as Record<string, unknown>) || {};
  return {
    id: String(raw.id ?? ''),
    name: String(raw.name ?? ''),
    description: String(raw.description ?? ''),
    slug: String(raw.slug ?? ''),
    previewImage,
    previewImages: previewImages.length ? previewImages : [previewImage],
    category: (raw.category as Template['category']) || 'other',
    tags: Array.isArray(raw.tags) ? (raw.tags as string[]) : [],
    price: raw.isFree || raw.is_free ? 0 : Math.round(Number(raw.priceCents ?? raw.price_cents ?? 0) / 100),
    currency: 'EUR',
    isPremium: Boolean(raw.priceCents ?? raw.price_cents),
    isFeatured: Boolean(raw.featured ?? raw.isFeatured ?? raw.is_featured),
    creatorId,
    creator: {
      id: String(creator.id ?? creatorId),
      name: String(creator.name ?? creator.displayName ?? 'Créateur'),
      username: String(creator.username ?? creatorId.slice(0, 8)),
      avatar: creator.avatar != null ? String(creator.avatar) : undefined,
      verified: Boolean(creator.verified),
    },
    downloads: Number(raw.downloads ?? 0),
    views: Number(raw.views ?? raw.downloads ?? 0) * 2,
    likes: Number(raw.likes ?? 0),
    rating: Number(raw.averageRating ?? raw.average_rating ?? raw.rating ?? 0),
    reviewCount: Number(raw.reviews ?? raw.reviewCount ?? 0),
    format: 'json',
    dimensions: { width: 4000, height: 4000 },
    fileSize: Number(raw.fileSize ?? 0) || 1000000,
    compatibility: ['luneo', 'photoshop', 'illustrator'],
    createdAt: toTs(raw.createdAt ?? raw.created_at),
    updatedAt: toTs(raw.updatedAt ?? raw.updated_at),
    publishedAt: raw.publishedAt != null || raw.published_at != null ? toTs(raw.publishedAt ?? raw.published_at) : undefined,
    status: (raw.status as Template['status']) || 'published',
  };
}

function normalizeApiReview(raw: Record<string, unknown>): Review {
  const user = (raw.user as Record<string, unknown>) || {};
  const createdAt = raw.createdAt ?? raw.created_at;
  const toTs = (v: unknown) => (v instanceof Date ? v.getTime() : typeof v === 'string' ? new Date(v).getTime() : Date.now());
  return {
    id: String(raw.id ?? ''),
    templateId: String(raw.templateId ?? raw.template_id ?? ''),
    userId: String(raw.userId ?? raw.user_id ?? ''),
    user: {
      name: String(user.name ?? 'Utilisateur'),
      avatar: user.avatar != null ? String(user.avatar) : undefined,
    },
    rating: Number(raw.rating ?? 0),
    title: String(raw.title ?? ''),
    content: String(raw.content ?? ''),
    helpful: Number(raw.helpful ?? 0),
    createdAt: toTs(createdAt),
    verified: Boolean(raw.verified),
  };
}

function MarketplaceTemplatePageContent({ params }: { params: { slug: string } | Promise<{ slug: string }> }) {
  const { t } = useI18n();
  const [resolvedParams, setResolvedParams] = React.useState<{ slug: string } | null>(null);
  const [template, setTemplate] = useState<Template | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isLiked, setIsLiked] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  const slug = resolvedParams?.slug ?? '';

  React.useEffect(() => {
    if (params instanceof Promise) {
      params.then(setResolvedParams).catch((error) => {
        logger.error('Failed to resolve params', { error });
      });
    } else {
      setResolvedParams(params);
    }
  }, [params]);

  useEffect(() => {
    if (!slug) return;
    let cancelled = false;
    setLoading(true);
    (async () => {
      try {
        const res = await endpoints.marketplace.template(slug);
        const raw = res as Record<string, unknown>;
        if (!cancelled) setTemplate(normalizeApiTemplate(raw));
      } catch (error) {
        logger.error('Failed to fetch marketplace template', { error, slug });
        if (!cancelled) setTemplate(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [slug]);

  useEffect(() => {
    if (!template?.id) return;
    let cancelled = false;
    setReviewsLoading(true);
    (async () => {
      try {
        const res = await endpoints.marketplace.reviews(template.id);
        const data = res as { reviews?: unknown[]; items?: unknown[] };
        const list = data?.reviews ?? data?.items ?? [];
        const normalized = (Array.isArray(list) ? list : []).map((r) => normalizeApiReview(r as Record<string, unknown>));
        if (!cancelled) setReviews(normalized);
      } catch {
        if (!cancelled) setReviews(EMPTY_REVIEWS);
      } finally {
        if (!cancelled) setReviewsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [template?.id]);

  // Rating distribution - memoized
  const displayTemplate = template;
  const displayReviews = reviews;

  const ratingDistribution = useMemo(() => {
    const total = displayReviews?.length ?? 0;
    if (total === 0) {
      return [5, 4, 3, 2, 1].map((stars) => ({ stars, count: 0, percentage: 0 }));
    }
    const counts = [0, 0, 0, 0, 0];
    displayReviews.forEach((r) => {
      const idx = Math.min(4, Math.max(0, Math.round(r.rating) - 1));
      counts[idx] += 1;
    });
    return [5, 4, 3, 2, 1].map((stars, i) => {
      const count = counts[i] ?? 0;
      return { stars, count, percentage: total ? Math.round((count / total) * 100) : 0 };
    });
  }, [displayReviews]);

  const formatDate = useCallback((timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }, []);

  const formatFileSize = useCallback((bytes: number) => {
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }, []);

  const imageCount = displayTemplate?.previewImages?.length ?? 0;

  const handlePreviousImage = useCallback(() => {
    setCurrentImageIndex((prev) =>
      prev === 0 ? Math.max(imageCount - 1, 0) : prev - 1
    );
  }, [imageCount]);

  const handleNextImage = useCallback(() => {
    setCurrentImageIndex((prev) =>
      prev >= imageCount - 1 ? 0 : prev + 1
    );
  }, [imageCount]);

  const handleImageSelect = useCallback((index: number) => {
    setCurrentImageIndex(index);
  }, []);

  const handleToggleLike = useCallback(() => {
    setIsLiked((prev) => !prev);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
        <div className="text-slate-400">{t('public.marketplace.loadingTemplate')}</div>
      </div>
    );
  }

  if (!displayTemplate) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center gap-4">
        <div className="text-slate-400 text-lg">{t('public.marketplace.templateNotFound')}</div>
        <Link href="/marketplace" className="text-purple-400 hover:text-purple-300 underline">
          {t('public.marketplace.backToMarketplace')}
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Breadcrumb */}
      <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
        <nav className="flex items-center gap-2 text-sm text-slate-400">
          <Link href="/marketplace" className="hover:text-white">
            Marketplace
          </Link>
          <ChevronRight className="w-4 h-4" />
          <span className="text-white">{displayTemplate.name}</span>
        </nav>
      </div>

      <div className="max-w-7xl mx-auto px-4 pb-16 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Images & Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Image Gallery */}
            <Card className="bg-slate-900 border-slate-800 overflow-hidden">
              <div className="relative aspect-[16/10]">
                <motion
                  key={currentImageIndex}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  as="img"
                  src={displayTemplate.previewImages[currentImageIndex] || displayTemplate.previewImage}
                  alt={displayTemplate.name}
                  className="w-full h-full object-cover"
                />
                
                {/* Navigation Arrows */}
                {displayTemplate.previewImages.length > 1 && (
                  <>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute left-4 top-1/2 -translate-y-1/2 bg-slate-900/80 hover:bg-slate-800"
                      onClick={handlePreviousImage}
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute right-4 top-1/2 -translate-y-1/2 bg-slate-900/80 hover:bg-slate-800"
                      onClick={handleNextImage}
                    >
                      <ChevronRight className="w-5 h-5" />
                    </Button>
                  </>
                )}

                {/* Badges */}
                <div className="absolute top-4 left-4 flex gap-2">
                  {displayTemplate.isFeatured && (
                    <Badge className="bg-amber-500">
                      <Crown className="w-3 h-3 mr-1" />
                      Vedette
                    </Badge>
                  )}
                </div>
              </div>

              {/* Thumbnails */}
              {displayTemplate.previewImages.length > 1 && (
                <div className="p-4 flex gap-2 overflow-x-auto">
                  {displayTemplate.previewImages.map((img, index) => (
                    <button
                      key={index}
                      onClick={() => handleImageSelect(index)}
                      className={`
                        flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all
                        ${currentImageIndex === index ? 'border-blue-500' : 'border-transparent hover:border-slate-600'}
                      `}
                    >
                      <OptimizedImage src={displayTemplate.previewImages[index] || displayTemplate.previewImage} alt={displayTemplate.name} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </Card>

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="bg-slate-900 border border-slate-800">
                <TabsTrigger value="overview">Description</TabsTrigger>
                <TabsTrigger value="reviews">
                  Avis ({displayTemplate.reviewCount})
                </TabsTrigger>
                <TabsTrigger value="specs">Spécifications</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="mt-6">
                <Card className="bg-slate-900 border-slate-800">
                  <CardContent className="p-6">
                    <div className="prose prose-invert max-w-none">
                      <p className="text-slate-300 whitespace-pre-line">
                        {displayTemplate.description}
                      </p>
                    </div>

                    {/* Tags */}
                    <div className="mt-6 pt-6 border-t border-slate-800">
                      <h4 className="text-sm font-medium mb-3">Tags</h4>
                      <div className="flex flex-wrap gap-2">
                        {displayTemplate.tags.map((tag) => (
                          <Badge key={tag} variant="outline" className="border-slate-700">
                            <Tag className="w-3 h-3 mr-1" />
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="reviews" className="mt-6 space-y-6">
                {/* Rating Summary */}
                <Card className="bg-slate-900 border-slate-800">
                  <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row gap-8">
                      {/* Average Rating */}
                      <div className="text-center">
                        <div className="text-5xl font-bold mb-2">{displayTemplate.rating}</div>
                        <div className="flex items-center justify-center gap-1 mb-2">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              className={`w-5 h-5 ${
                                star <= Math.round(displayTemplate.rating)
                                  ? 'text-amber-400 fill-amber-400'
                                  : 'text-slate-600'
                              }`}
                            />
                          ))}
                        </div>
                        <p className="text-sm text-slate-400">{displayTemplate.reviewCount} avis</p>
                      </div>

                      {/* Distribution */}
                      <div className="flex-1 space-y-2">
                        {ratingDistribution.map(({ stars, count, percentage }) => (
                          <div key={stars} className="flex items-center gap-3">
                            <span className="text-sm w-12">{stars} étoiles</span>
                            <Progress value={percentage} className="flex-1 h-2" />
                            <span className="text-sm text-slate-400 w-8">{count}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Reviews List */}
                <div className="space-y-4">
                  {displayReviews.map((review) => (
                    <Card key={review.id} className="bg-slate-900 border-slate-800">
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <Avatar>
                              <AvatarImage src={review.user.avatar} />
                              <AvatarFallback className="bg-slate-700">
                                {review.user.name.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-medium">{review.user.name}</span>
                                {review.verified && (
                                  <Badge className="bg-green-500/20 text-green-400 text-xs">
                                    <Check className="w-3 h-3 mr-1" />
                                    Achat vérifié
                                  </Badge>
                                )}
                              </div>
                              <p className="text-sm text-slate-400">{formatDate(review.createdAt)}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star
                                key={star}
                                className={`w-4 h-4 ${
                                  star <= review.rating
                                    ? 'text-amber-400 fill-amber-400'
                                    : 'text-slate-600'
                                }`}
                              />
                            ))}
                          </div>
                        </div>

                        <h4 className="font-semibold mb-2">{review.title}</h4>
                        <p className="text-slate-300">{review.content}</p>

                        <div className="flex items-center gap-4 mt-4 pt-4 border-t border-slate-800">
                          <Button variant="ghost" size="sm" className="text-slate-400">
                            <ThumbsUp className="w-4 h-4 mr-1" />
                            Utile ({review.helpful})
                          </Button>
                          <Button variant="ghost" size="sm" className="text-slate-400">
                            <Flag className="w-4 h-4 mr-1" />
                            Signaler
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="specs" className="mt-6">
                <Card className="bg-slate-900 border-slate-800">
                  <CardContent className="p-6">
                    <div className="grid grid-cols-2 gap-6">
                      <div>
                        <h4 className="text-sm text-slate-400 mb-1">Format</h4>
                        <p className="font-medium">{displayTemplate.format.toUpperCase()}</p>
                      </div>
                      <div>
                        <h4 className="text-sm text-slate-400 mb-1">Dimensions</h4>
                        <p className="font-medium">{displayTemplate.dimensions.width} x {displayTemplate.dimensions.height}px</p>
                      </div>
                      <div>
                        <h4 className="text-sm text-slate-400 mb-1">Taille du fichier</h4>
                        <p className="font-medium">{formatFileSize(displayTemplate.fileSize)}</p>
                      </div>
                      <div>
                        <h4 className="text-sm text-slate-400 mb-1">Compatibilité</h4>
                        <p className="font-medium capitalize">{displayTemplate.compatibility.join(', ')}</p>
                      </div>
                      <div>
                        <h4 className="text-sm text-slate-400 mb-1">Publié le</h4>
                        <p className="font-medium">{formatDate(displayTemplate.publishedAt || displayTemplate.createdAt)}</p>
                      </div>
                      <div>
                        <h4 className="text-sm text-slate-400 mb-1">Dernière mise à jour</h4>
                        <p className="font-medium">{formatDate(displayTemplate.updatedAt)}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* Right Column - Purchase Card */}
          <div className="space-y-6">
            {/* Price Card */}
            <Card className="bg-slate-900 border-slate-800 sticky top-4">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-6">
                  {displayTemplate.price > 0 ? (
                    <div>
                      <span className="text-4xl font-bold">{displayTemplate.price}€</span>
                      <span className="text-slate-400 ml-2">TTC</span>
                    </div>
                  ) : (
                    <Badge className="bg-green-500 text-lg py-1 px-3">Gratuit</Badge>
                  )}
                </div>

                <div className="space-y-3 mb-6">
                  <Button className="w-full h-12 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700">
                    <ShoppingCart className="w-5 h-5 mr-2" />
                    {displayTemplate.price > 0 ? 'Acheter maintenant' : 'Télécharger'}
                  </Button>
                  <Button variant="outline" className="w-full border-slate-700">
                    <Eye className="w-4 h-4 mr-2" />
                    Prévisualiser
                  </Button>
                </div>

                <div className="flex items-center gap-4 justify-center border-t border-slate-800 pt-4">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleToggleLike}
                  >
                    <Heart className={`w-4 h-4 mr-1 ${isLiked ? 'fill-red-500 text-red-500' : ''}`} />
                    {displayTemplate.likes + (isLiked ? 1 : 0)}
                  </Button>
                  <Button variant="ghost" size="sm">
                    <Share2 className="w-4 h-4 mr-1" />
                    Partager
                  </Button>
                </div>

                {/* Trust badges */}
                <div className="mt-6 pt-6 border-t border-slate-800 space-y-3">
                  <div className="flex items-center gap-3 text-sm text-slate-400">
                    <Shield className="w-4 h-4 text-green-400" />
                    <span>Paiement sécurisé</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-slate-400">
                    <Download className="w-4 h-4 text-green-400" />
                    <span>Téléchargement immédiat</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-slate-400">
                    <FileText className="w-4 h-4 text-green-400" />
                    <span>Licence commerciale incluse</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Creator Card */}
            <Card className="bg-slate-900 border-slate-800">
              <CardHeader>
                <CardTitle className="text-lg">{t('public.marketplace.creator')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4 mb-4">
                  <Avatar className="w-14 h-14">
                    <AvatarImage src={displayTemplate.creator.avatar} />
                    <AvatarFallback className="bg-gradient-to-br from-purple-500 to-blue-500 text-lg">
                      {displayTemplate.creator.name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{displayTemplate.creator.name}</span>
                      {displayTemplate.creator.verified && (
                        <Check className="w-4 h-4 text-blue-400" />
                      )}
                    </div>
                    <p className="text-sm text-slate-400">@{displayTemplate.creator.username}</p>
                  </div>
                </div>
                <Button variant="outline" className="w-full border-slate-700">
                  <User className="w-4 h-4 mr-2" />
                  {t('public.marketplace.viewProfile')}
                </Button>
              </CardContent>
            </Card>

            {/* Stats */}
            <Card className="bg-slate-900 border-slate-800">
              <CardContent className="p-6">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-2xl font-bold">{displayTemplate.downloads.toLocaleString()}</p>
                    <p className="text-sm text-slate-400">Téléchargements</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{displayTemplate.views.toLocaleString()}</p>
                    <p className="text-sm text-slate-400">Vues</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{displayTemplate.likes}</p>
                    <p className="text-sm text-slate-400">Likes</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

const MarketplaceTemplatePageMemo = memo(MarketplaceTemplatePageContent);

export default function MarketplaceTemplatePage({ params }: { params: { slug: string } | Promise<{ slug: string }> }) {
  return (
    <ErrorBoundary componentName="MarketplaceTemplatePage">
      <MarketplaceTemplatePageMemo params={params} />
    </ErrorBoundary>
  );
}


