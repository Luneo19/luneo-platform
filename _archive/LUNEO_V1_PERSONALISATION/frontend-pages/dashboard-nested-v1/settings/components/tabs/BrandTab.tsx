'use client';

import { useState, useEffect, useCallback } from 'react';
import { useI18n } from '@/i18n/useI18n';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { getErrorDisplayMessage } from '@/lib/hooks/useErrorToast';
import { logger } from '@/lib/logger';
import { endpoints } from '@/lib/api/client';
import Image from 'next/image';

export function BrandTab() {
  const { t } = useI18n();
  const { toast } = useToast();
  const [brandName, setBrandName] = useState('');
  const [brandDomain, setBrandDomain] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [primaryColor, setPrimaryColor] = useState('#6366f1');
  const [secondaryColor, setSecondaryColor] = useState('#8b5cf6');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchBrandSettings = useCallback(async () => {
    try {
      const res = await endpoints.brands.settings();
      const data = (res as { brandSettings?: Record<string, unknown> })?.brandSettings ?? (res as Record<string, unknown>);
      if (data) {
        setBrandName((data.brand_name as string) ?? '');
        setBrandDomain((data.brand_domain as string) ?? '');
        setLogoUrl((data.logo_url as string) ?? '');
        setPrimaryColor((data.primary_color as string) ?? '#6366f1');
        setSecondaryColor((data.secondary_color as string) ?? '#8b5cf6');
      }
    } catch (error) {
      logger.error('Error fetching brand settings', { error });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBrandSettings();
  }, [fetchBrandSettings]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await endpoints.brands.updateSettings({
        brand_name: brandName,
        brand_domain: brandDomain,
        logo_url: logoUrl,
        primary_color: primaryColor,
        secondary_color: secondaryColor,
      });
      toast({
        title: t('common.success'),
        description: t('settings.brand.saved') || 'Paramètres de marque mis à jour',
      });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: t('common.error'),
        description: getErrorDisplayMessage(error),
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center p-8">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('settings.brand.title') || 'Marque'}</CardTitle>
        <CardDescription>
          {t('settings.brand.description') || 'Personnalisez votre marque et storefront'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label>{t('settings.brand.name') || 'Nom de la marque'}</Label>
          <Input value={brandName} onChange={(e) => setBrandName(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>{t('settings.brand.domain') || 'Domaine'}</Label>
          <Input
            value={brandDomain}
            onChange={(e) => setBrandDomain(e.target.value)}
            placeholder="monstore.luneo.app"
          />
        </div>
        <div className="space-y-2">
          <Label>{t('settings.brand.logoUrl') || 'URL du logo'}</Label>
          <Input
            value={logoUrl}
            onChange={(e) => setLogoUrl(e.target.value)}
            placeholder="https://..."
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>{t('settings.brand.primaryColor') || 'Couleur primaire'}</Label>
            <div className="flex gap-2">
              <input
                type="color"
                value={primaryColor}
                onChange={(e) => setPrimaryColor(e.target.value)}
                className="h-10 w-10 cursor-pointer rounded border"
              />
              <Input value={primaryColor} onChange={(e) => setPrimaryColor(e.target.value)} />
            </div>
          </div>
          <div className="space-y-2">
            <Label>{t('settings.brand.secondaryColor') || 'Couleur secondaire'}</Label>
            <div className="flex gap-2">
              <input
                type="color"
                value={secondaryColor}
                onChange={(e) => setSecondaryColor(e.target.value)}
                className="h-10 w-10 cursor-pointer rounded border"
              />
              <Input value={secondaryColor} onChange={(e) => setSecondaryColor(e.target.value)} />
            </div>
          </div>
        </div>
        {logoUrl && (
          <div className="space-y-2">
            <Label>Aperçu</Label>
            <Image width={200} height={200}
              src={logoUrl}
              alt="Logo"
              className="h-16 w-auto rounded border object-contain p-2"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            unoptimized />
          </div>
        )}
        <Button onClick={handleSave} disabled={saving}>
          {saving
            ? t('settings.profile.saving') || 'Enregistrement...'
            : t('settings.profile.save') || 'Enregistrer'}
        </Button>
      </CardContent>
    </Card>
  );
}
