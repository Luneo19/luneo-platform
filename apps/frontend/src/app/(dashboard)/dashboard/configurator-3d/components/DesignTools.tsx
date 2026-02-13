/**
 * Outils de design pour le Configurator 3D
 */

'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Upload } from 'lucide-react';
import { useI18n } from '@/i18n/useI18n';
import type { Configuration3D } from '../types';

interface DesignToolsProps {
  configuration: Configuration3D | null;
  onUpdate: (updates: Partial<Configuration3D>) => void;
}

export function DesignTools({ configuration, onUpdate }: DesignToolsProps) {
  const { t } = useI18n();
  if (!configuration) return null;

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const url = event.target?.result as string;
      const newImage = {
        id: `img-${Date.now()}`,
        url,
        position: { x: 0, y: 0, z: 0 },
        scale: 1,
        rotation: 0,
      };

      onUpdate({
        customImages: [...(configuration.customImages || []), newImage],
      });
    };
    reader.readAsDataURL(file);
  };

  return (
    <Card className="bg-gray-50 border-gray-200">
      <CardHeader>
        <CardTitle className="text-gray-900">Outils de design</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label className="text-gray-700">Upload d'image</Label>
          <div className="mt-2">
            <Input
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
              id="image-upload"
            />
            <Label
              htmlFor="image-upload"
              className="flex items-center justify-center w-full p-4 border-2 border-dashed border-gray-200 rounded-lg cursor-pointer hover:border-cyan-500 transition-colors"
            >
              <Upload className="w-5 h-5 mr-2 text-gray-600" />
              <span className="text-gray-600">Cliquez pour uploader</span>
            </Label>
          </div>
        </div>

        {configuration.customImages && configuration.customImages.length > 0 && (
          <div>
            <Label className="text-gray-700">Images uploadées</Label>
            <div className="grid grid-cols-2 gap-2 mt-2">
              {configuration.customImages.map((img) => (
                <div key={img.id} className="relative">
                  <img
                    src={img.url}
                    alt="Custom"
                    className="w-full h-20 object-cover rounded"
                  />
                  <Button
                    variant="destructive"
                    size="sm"
                    className="absolute top-1 right-1"
                    onClick={() => {
                      onUpdate({
                        customImages: configuration.customImages?.filter((i) => i.id !== img.id),
                      });
                    }}
                  >
                    ×
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}



