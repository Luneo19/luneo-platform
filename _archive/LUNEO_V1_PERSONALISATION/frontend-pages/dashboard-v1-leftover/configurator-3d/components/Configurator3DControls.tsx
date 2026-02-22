/**
 * Contrôles pour le Configurator 3D
 */

'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RotateCcw } from 'lucide-react';
import { useI18n } from '@/i18n/useI18n';
import { MATERIALS, COLORS } from '../constants/materials';
import type { Configuration3D } from '../types';

interface Configurator3DControlsProps {
  configuration: Configuration3D | null;
  onUpdate: (updates: Partial<Configuration3D>) => void;
  onReset: () => void;
}

export function Configurator3DControls({
  configuration,
  onUpdate,
  onReset,
}: Configurator3DControlsProps) {
  const { t } = useI18n();
  if (!configuration) return null;

  return (
    <Card className="bg-gray-50 border-gray-200">
      <CardHeader>
        <CardTitle className="text-gray-900">{t('configurator3d.controls')}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label className="text-gray-700">{t('configurator3d.material')}</Label>
          <Select
            value={configuration.material}
            onValueChange={(value) => onUpdate({ material: value })}
          >
            <SelectTrigger className="bg-white border-gray-200 text-gray-900">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {MATERIALS.map((material) => (
                <SelectItem key={material.id} value={material.id}>
                  {t(`configurator3d.materialNames.${material.id}` as 'configurator3d.materialNames.leather') || material.id}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label className="text-gray-700">{t('configurator3d.color')}</Label>
          <div className="grid grid-cols-4 gap-2 mt-2">
            {COLORS.map((color) => (
              <button
                key={color.value}
                onClick={() => onUpdate({ color: color.value })}
                className={`w-10 h-10 rounded border-2 ${
                  configuration.color === color.value
                    ? 'border-cyan-400'
                    : 'border-gray-200'
                }`}
                style={{ backgroundColor: color.value }}
                title={color.name}
              />
            ))}
          </div>
          <Input
            type="color"
            value={configuration.color}
            onChange={(e) => onUpdate({ color: e.target.value })}
            className="mt-2 bg-white border-gray-200"
          />
        </div>

        <div>
          <Label className="text-gray-700">{t('configurator3d.engraving')}</Label>
          <Input
            value={configuration.engraving || ''}
            onChange={(e) => onUpdate({ engraving: e.target.value })}
            placeholder={t('configurator3d.engravingPlaceholder')}
            className="bg-white border-gray-200 text-gray-900"
          />
        </div>

        <Button variant="outline" onClick={onReset} className="w-full border-gray-200">
          <RotateCcw className="w-4 h-4 mr-2" />
          {t('configurator3d.reset')}
        </Button>
      </CardContent>
    </Card>
  );
}



