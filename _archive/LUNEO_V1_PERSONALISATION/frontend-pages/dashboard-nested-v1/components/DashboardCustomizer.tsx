'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useDashboardStore } from '@/store/dashboard.store';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { ChevronUp, ChevronDown } from 'lucide-react';
import { logger } from '@/lib/logger';
import type { IndustryWidgetConfig } from '@/store/industry.store';

interface WidgetOverride {
  visible?: boolean;
  order?: number;
}

export function DashboardCustomizer() {
  const {
    dashboardConfig,
    userPreferences,
    isCustomizing,
    toggleCustomizing,
    updatePreferences,
    resetPreferences,
  } = useDashboardStore();

  const widgets = useMemo(
    () => [...(dashboardConfig?.widgets ?? [])].sort((a, b) => a.position - b.position),
    [dashboardConfig?.widgets]
  );

  const overrides = (userPreferences?.widgetOverrides ?? null) as Record<string, WidgetOverride> | null | undefined;

  const [visible, setVisible] = useState<Record<string, boolean>>({});
  const [order, setOrder] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const visibleMap: Record<string, boolean> = {};
    const sorted = [...widgets].sort((a, b) => {
      const posA = overrides?.[a.widgetSlug]?.order ?? a.position;
      const posB = overrides?.[b.widgetSlug]?.order ?? b.position;
      return posA - posB;
    });
    sorted.forEach((w) => {
      const o = overrides?.[w.widgetSlug];
      visibleMap[w.widgetSlug] = o?.visible ?? w.isDefaultVisible;
    });
    setVisible(visibleMap);
    setOrder(sorted.map((w) => w.widgetSlug));
  }, [widgets, overrides]);

  const orderedWidgets = useMemo(() => {
    return order
      .map((slug) => widgets.find((w) => w.widgetSlug === slug))
      .filter(Boolean) as IndustryWidgetConfig[];
  }, [order, widgets]);

  const handleToggle = (slug: string, checked: boolean) => {
    setVisible((prev) => ({ ...prev, [slug]: checked }));
  };

  const handleMove = (slug: string, dir: 'up' | 'down') => {
    const idx = order.indexOf(slug);
    if (idx < 0) return;
    const next = dir === 'up' ? idx - 1 : idx + 1;
    if (next < 0 || next >= order.length) return;
    const newOrder = [...order];
    [newOrder[idx], newOrder[next]] = [newOrder[next], newOrder[idx]];
    setOrder(newOrder);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const widgetOverrides: Record<string, WidgetOverride> = {};
      order.forEach((slug, i) => {
        widgetOverrides[slug] = {
          visible: visible[slug] ?? true,
          order: i,
        };
      });
      await updatePreferences({ widgetOverrides });
      toggleCustomizing();
    } catch (e) {
      logger.error('Failed to save dashboard preferences', e instanceof Error ? e : new Error(String(e)));
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    setSaving(true);
    try {
      await resetPreferences();
      toggleCustomizing();
    } catch (e) {
      logger.error('Failed to reset dashboard preferences', e instanceof Error ? e : new Error(String(e)));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={isCustomizing} onOpenChange={(open) => !open && toggleCustomizing()}>
      <DialogContent className="bg-white border-gray-200 text-gray-900 max-w-md">
        <DialogHeader>
          <DialogTitle className="text-gray-900">Personnaliser le tableau de bord</DialogTitle>
          <DialogDescription className="text-gray-600">
            Choisissez les widgets affichés et leur ordre.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2 max-h-[60vh] overflow-y-auto py-2">
          {orderedWidgets.map((w, i) => (
            <div
              key={w.id}
              className="flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 p-2"
            >
              <Checkbox
                checked={visible[w.widgetSlug] ?? w.isDefaultVisible}
                onCheckedChange={(checked) =>
                  handleToggle(w.widgetSlug, checked === true)
                }
                className="border-gray-300 data-[state=checked]:bg-gray-600"
              />
              <span className="flex-1 text-sm text-gray-700 truncate">
                {w.widgetSlug}
              </span>
              <div className="flex items-center gap-0">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-gray-600 hover:text-gray-900"
                  onClick={() => handleMove(w.widgetSlug, 'up')}
                  disabled={i === 0}
                >
                  <ChevronUp className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-gray-600 hover:text-gray-900"
                  onClick={() => handleMove(w.widgetSlug, 'down')}
                  disabled={i === orderedWidgets.length - 1}
                >
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="outline"
            className="border-gray-300 text-gray-700"
            onClick={handleReset}
            disabled={saving}
          >
            Réinitialiser
          </Button>
          <Button
            className="bg-gray-600 hover:bg-gray-500 text-white"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? 'Enregistrement…' : 'Enregistrer'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
