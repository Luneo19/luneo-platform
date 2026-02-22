'use client';

import { useState } from 'react';
import { Type, Upload, Search, Loader2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { useFonts } from '@/hooks/customizer/useFonts';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

/**
 * FontsPanel - Font browser panel
 */
export function FontsPanel() {
  const { toast } = useToast();
  const { fonts, systemFonts, customFonts, isLoading, loadFont } = useFonts();
  const [searchQuery, setSearchQuery] = useState('');

  const filteredSystemFonts = systemFonts.filter((font) =>
    font.family.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredCustomFonts = customFonts.filter((font) =>
    font.family.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleFontSelect = async (font: { family: string; url?: string }) => {
    try {
      await loadFont(font.family, font.url);
      toast({
        title: 'Font loaded',
        description: `${font.family} has been loaded`,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load font',
        variant: 'destructive',
      });
    }
  };

  const handleFontUpload = () => {
    toast({
      title: 'Upload Font',
      description: 'Font upload dialog will open',
    });
  };

  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Type className="h-5 w-5" />
          <CardTitle>Fonts</CardTitle>
        </div>
        <CardDescription>Browse and manage fonts</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Search */}
        <div className="space-y-2">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search fonts..."
              className="pl-8"
            />
          </div>
        </div>

        {/* Upload Button */}
        <Button onClick={handleFontUpload} variant="outline" className="w-full">
          <Upload className="h-4 w-4 mr-2" />
          Upload Font
        </Button>

        <Separator />

        <ScrollArea className="h-[calc(100vh-300px)]">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="space-y-6">
              {/* System Fonts */}
              <div className="space-y-2">
                <Label className="text-sm font-semibold">System Fonts</Label>
                <div className="space-y-2">
                  {filteredSystemFonts.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-4 text-center">
                      No system fonts found
                    </p>
                  ) : (
                    filteredSystemFonts.map((font) => (
                      <button
                        key={font.id || font.family}
                        onClick={() => handleFontSelect(font)}
                        className="w-full text-left p-3 rounded border hover:bg-muted transition-colors"
                        style={{ fontFamily: font.family }}
                      >
                        <div className="font-medium">{font.family}</div>
                        <div className="text-xs text-muted-foreground mt-1">
                          The quick brown fox jumps over the lazy dog
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </div>

              {/* Custom Fonts */}
              {filteredCustomFonts.length > 0 && (
                <>
                  <Separator />
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold">Custom Fonts</Label>
                    <div className="space-y-2">
                      {filteredCustomFonts.map((font) => (
                        <button
                          key={font.id || font.family}
                          onClick={() => handleFontSelect(font)}
                          className="w-full text-left p-3 rounded border hover:bg-muted transition-colors"
                          style={{ fontFamily: font.family }}
                        >
                          <div className="font-medium">{font.family}</div>
                          <div className="text-xs text-muted-foreground mt-1">
                            The quick brown fox jumps over the lazy dog
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
