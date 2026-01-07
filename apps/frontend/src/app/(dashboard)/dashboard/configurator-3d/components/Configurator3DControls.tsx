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
  if (!configuration) return null;

  return (
    <Card className="bg-gray-800/50 border-gray-700">
      <CardHeader>
        <CardTitle className="text-white">Contrôles</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label className="text-gray-300">Matériau</Label>
          <Select
            value={configuration.material}
            onValueChange={(value) => onUpdate({ material: value })}
          >
            <SelectTrigger className="bg-gray-900 border-gray-600 text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {MATERIALS.map((material) => (
                <SelectItem key={material.id} value={material.id}>
                  {material.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label className="text-gray-300">Couleur</Label>
          <div className="grid grid-cols-4 gap-2 mt-2">
            {COLORS.map((color) => (
              <button
                key={color.value}
                onClick={() => onUpdate({ color: color.value })}
                className={`w-10 h-10 rounded border-2 ${
                  configuration.color === color.value
                    ? 'border-cyan-400'
                    : 'border-gray-600'
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
            className="mt-2 bg-gray-900 border-gray-600"
          />
        </div>

        <div>
          <Label className="text-gray-300">Gravure</Label>
          <Input
            value={configuration.engraving || ''}
            onChange={(e) => onUpdate({ engraving: e.target.value })}
            placeholder="Texte à graver"
            className="bg-gray-900 border-gray-600 text-white"
          />
        </div>

        <Button variant="outline" onClick={onReset} className="w-full border-gray-600">
          <RotateCcw className="w-4 h-4 mr-2" />
          Réinitialiser
        </Button>
      </CardContent>
    </Card>
  );
}


