'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  RotateCcw,
  Undo2,
  Redo2,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Minimize2,
  ShoppingCart,
  Save,
  Share2,
  Camera,
  Smartphone,
} from 'lucide-react';
import { useConfigurator3DStore } from '@/stores/configurator-3d/configurator.store';
import { useConfigurator3D } from '@/hooks/configurator-3d';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

export interface Configurator3DUIProps {
  configurationId: string | null;
  className?: string;
  /** When set, Add to cart redirects to this URL instead of Luneo cart */
  brandWebsite?: string;
}

/**
 * Configurator3DUI - UI overlay with selector panel, pricing, toolbar, zoom
 */
export function Configurator3DUI({ configurationId, className, brandWebsite }: Configurator3DUIProps) {
  const [mobilePanelOpen, setMobilePanelOpen] = useState(false);

  const {
    configuration,
    selections,
    price,
    validation,
    actions,
    camera,
    history,
  } = useConfigurator3D(configurationId ? { configurationId } : { configurationId: null });

  const uiSettings = configuration?.uiSettings;
  const layout = uiSettings?.layout ?? 'sidebar';
  const panelSide = layout === 'sidebar' ? 'right' : 'bottom';
  const showPrice = uiSettings?.showPrice ?? configuration?.features?.enablePricing ?? true;
  const showReset = uiSettings?.showReset ?? true;
  const showShare = uiSettings?.showShare ?? configuration?.features?.enableSharing ?? true;
  const showSave = uiSettings?.showSave ?? true;
  const showAR = uiSettings?.showAR ?? configuration?.features?.enableAR ?? true;
  const showScreenshot = uiSettings?.showScreenshot ?? configuration?.features?.enableScreenshots ?? true;

  const isPanelCollapsed = useConfigurator3DStore((s) => s.ui.isPanelCollapsed);
  const togglePanel = useConfigurator3DStore((s) => s.togglePanel);
  const isFullscreen = useConfigurator3DStore((s) => s.ui.isFullscreen);
  const toggleFullscreen = useConfigurator3DStore((s) => s.toggleFullscreen);

  const currency = configuration?.pricingSettings?.currency ?? 'EUR';

  const formatPrice = (value: number) =>
    new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);

  const components = configuration?.components ?? [];
  const visibleComponents = components
    .filter((c) => c.isVisible && c.isEnabled)
    .sort((a, b) => a.sortOrder - b.sortOrder);

  const SelectorPanel = (
    <div className="flex h-full flex-col">
      <ScrollArea className="flex-1 pr-4">
        <div className="space-y-6">
          {visibleComponents.map((comp) => {
            const selected = selections[comp.id];
            const selectedIds = Array.isArray(selected) ? selected : selected ? [selected] : [];

            return (
              <div key={comp.id} className="space-y-3">
                <h4 className="text-sm font-medium text-foreground">{comp.name}</h4>
                <div className="flex flex-wrap gap-2">
                  {comp.options
                    .filter((o) => o.isVisible && o.isEnabled)
                    .sort((a, b) => a.sortOrder - b.sortOrder)
                    .map((opt) => {
                      const isSelected = selectedIds.includes(opt.id);
                      return (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => actions.select(comp.id, opt.id)}
                          className={cn(
                            'flex items-center gap-2 rounded-lg border-2 px-3 py-2 text-sm transition-all',
                            isSelected
                              ? 'border-primary bg-primary/10 text-primary'
                              : 'border-border bg-background hover:border-primary/50'
                          )}
                        >
                          {opt.swatchImageUrl ? (
                            <img
                              src={opt.swatchImageUrl}
                              alt={opt.name}
                              className="h-6 w-6 rounded-full object-cover"
                            />
                          ) : (
                            <div
                              className="h-6 w-6 rounded-full border"
                              style={{
                                backgroundColor:
                                  opt.value?.type === 'COLOR' ? opt.value.hex : '#888',
                              }}
                            />
                          )}
                          <span>{opt.name}</span>
                        </button>
                      );
                    })}
                </div>
              </div>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );

  const PricingPanel = showPrice && (
    <Card className="border-primary/20 bg-primary/5">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Price</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-bold text-primary">{formatPrice(price)}</p>
      </CardContent>
    </Card>
  );

  const Toolbar = (
    <div className="flex flex-wrap items-center gap-2">
      {showReset && (
        <Button
          variant="outline"
          size="icon"
          onClick={actions.reset}
          aria-label="Reset"
        >
          <RotateCcw className="h-4 w-4" />
        </Button>
      )}
      <Button
        variant="outline"
        size="icon"
        onClick={actions.undo}
        disabled={!history.canUndo}
        aria-label="Undo"
      >
        <Undo2 className="h-4 w-4" />
      </Button>
      <Button
        variant="outline"
        size="icon"
        onClick={actions.redo}
        disabled={!history.canRedo}
        aria-label="Redo"
      >
        <Redo2 className="h-4 w-4" />
      </Button>
      {showSave && (
        <Button variant="outline" size="icon" onClick={() => actions.save()} aria-label="Save">
          <Save className="h-4 w-4" />
        </Button>
      )}
      {showShare && (
        <Button variant="outline" size="icon" onClick={() => actions.share()} aria-label="Share">
          <Share2 className="h-4 w-4" />
        </Button>
      )}
      {showScreenshot && (
        <Button
          variant="outline"
          size="icon"
          onClick={() => actions.exportActions.image()}
          aria-label="Screenshot"
        >
          <Camera className="h-4 w-4" />
        </Button>
      )}
      {showAR && (
        <Button
          variant="outline"
          size="icon"
          onClick={() => actions.exportActions.ar()}
          aria-label="View in AR"
        >
          <Smartphone className="h-4 w-4" />
        </Button>
      )}
      <Button
        variant="outline"
        size="icon"
        onClick={toggleFullscreen}
        aria-label={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
      >
        {isFullscreen ? (
          <Minimize2 className="h-4 w-4" />
        ) : (
          <Maximize2 className="h-4 w-4" />
        )}
      </Button>
    </div>
  );

  const ZoomControls = (
    <div className="flex flex-col gap-1 rounded-lg border bg-background/80 p-1 backdrop-blur-sm">
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8"
        onClick={camera.zoomIn}
        aria-label="Zoom in"
      >
        <ZoomIn className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8"
        onClick={camera.zoomOut}
        aria-label="Zoom out"
      >
        <ZoomOut className="h-4 w-4" />
      </Button>
    </div>
  );

  return (
    <div className={cn('pointer-events-none flex h-full w-full', className)}>
      <div className="pointer-events-auto flex flex-1 flex-col gap-4 p-4">
        {/* Top toolbar */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between"
        >
          {Toolbar}
        </motion.div>
      </div>

      {/* Zoom controls - bottom right */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.2 }}
        className="pointer-events-auto absolute bottom-4 right-4"
      >
        {ZoomControls}
      </motion.div>

      {/* Desktop sidebar panel */}
      <AnimatePresence>
        {!isPanelCollapsed && (
          <motion.aside
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 320, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="pointer-events-auto hidden w-80 flex-shrink-0 border-l bg-background/95 backdrop-blur-sm lg:block"
          >
            <div className="flex h-full flex-col gap-4 overflow-hidden p-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">Customize</h3>
                <Button variant="ghost" size="icon" onClick={togglePanel}>
                  ×
                </Button>
              </div>
              {SelectorPanel}
              {PricingPanel}
              <Button
                className="w-full"
                onClick={() => {
                  if (brandWebsite) {
                    window.open(brandWebsite, '_blank', 'noopener,noreferrer');
                  } else {
                    actions.addToCart();
                  }
                }}
                disabled={!validation.valid}
              >
                <ShoppingCart className="mr-2 h-4 w-4" />
                {brandWebsite ? 'Buy on website' : 'Add to cart'}
              </Button>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Mobile: bottom sheet */}
      <div className="pointer-events-auto lg:hidden">
        <Sheet open={mobilePanelOpen} onOpenChange={setMobilePanelOpen}>
          <SheetTrigger asChild>
            <Button
              variant="secondary"
              className="fixed bottom-4 left-4 right-4 z-40 lg:hidden"
            >
              Customize
            </Button>
          </SheetTrigger>
          <SheetContent side="bottom" className="h-[70vh]">
            <SheetHeader>
              <SheetTitle>Customize</SheetTitle>
            </SheetHeader>
            <div className="mt-4 flex flex-1 flex-col gap-4 overflow-hidden">
              {SelectorPanel}
              {PricingPanel}
              <Button
                className="w-full"
                onClick={() => {
                  if (brandWebsite) {
                    window.open(brandWebsite, '_blank', 'noopener,noreferrer');
                    setMobilePanelOpen(false);
                  } else {
                    actions.addToCart();
                    setMobilePanelOpen(false);
                  }
                }}
                disabled={!validation.valid}
              >
                <ShoppingCart className="mr-2 h-4 w-4" />
                {brandWebsite ? 'Buy on website' : 'Add to cart'}
              </Button>
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* Collapsed panel toggle (desktop) */}
      {isPanelCollapsed && (
        <Button
          variant="outline"
          size="sm"
          className="pointer-events-auto absolute left-4 top-1/2 -translate-y-1/2 hidden lg:flex"
          onClick={togglePanel}
        >
          Customize
        </Button>
      )}
    </div>
  );
}
