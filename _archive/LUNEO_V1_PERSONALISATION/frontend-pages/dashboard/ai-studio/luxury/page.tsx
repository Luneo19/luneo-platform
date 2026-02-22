'use client';

import React, { memo, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Sparkles, Crown, Gem, Star, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/lib/api/client';
import { logger } from '@/lib/logger';
import Image from 'next/image';

const LUXURY_STYLES = [
  { value: 'haute-couture', label: 'Haute Couture', desc: 'Élégance parisienne intemporelle' },
  { value: 'minimalist-luxe', label: 'Luxe Minimaliste', desc: 'Lignes épurées, matériaux nobles' },
  { value: 'art-deco', label: 'Art Déco', desc: 'Géométrie dorée et symétrie' },
  { value: 'contemporary', label: 'Contemporain Premium', desc: 'Innovation et modernité' },
  { value: 'heritage', label: 'Héritage & Tradition', desc: 'Savoir-faire ancestral' },
];

const LUXURY_MATERIALS = [
  'Or 24 carats', 'Platine', 'Diamant', 'Soie', 'Cuir pleine fleur',
  'Marbre de Carrare', 'Cristal Baccarat', 'Cachemire', 'Ébène', 'Palissandre',
];

function LuxuryAIPageContent() {
  const { toast } = useToast();
  const [prompt, setPrompt] = useState('');
  const [style, setStyle] = useState('haute-couture');
  const [materials, setMaterials] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [results, setResults] = useState<Array<{ id: string; url: string; prompt: string }>>([]);

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast({ title: 'Prompt requis', description: 'Décrivez le produit de luxe à générer.', variant: 'destructive' });
      return;
    }

    setIsGenerating(true);
    try {
      const luxuryPrompt = `[Style: ${style}] [Materials: ${materials.join(', ') || 'auto'}] ${prompt}`;
      const data = await api.post<{ id?: string; url?: string; imageUrl?: string } | null>(
        '/api/v1/ai/generate',
        { prompt: luxuryPrompt, style: 'luxury', quality: 'hd' }
      );
      if (data?.url || data?.imageUrl) {
        setResults((prev) => [{
          id: data.id || Date.now().toString(),
          url: (data.url || data.imageUrl) as string,
          prompt: luxuryPrompt,
        }, ...prev]);
        toast({ title: 'Génération réussie', description: 'Votre design de luxe a été créé.' });
      } else {
        toast({ title: 'Génération en cours', description: 'Le design est en cours de traitement. Vérifiez dans l\'historique.' });
      }
    } catch (error) {
      logger.error('Luxury generation failed', { error: String(error) });
      toast({ title: 'Erreur de génération', description: 'Veuillez réessayer ou vérifier vos crédits AI.', variant: 'destructive' });
    } finally {
      setIsGenerating(false);
    }
  };

  const toggleMaterial = (mat: string) => {
    setMaterials((prev) => prev.includes(mat) ? prev.filter((m) => m !== mat) : [...prev, mat]);
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white py-4 sm:py-6 md:py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
          <Link href="/ai-studio">
            <Button variant="ghost" size="icon" className="h-8 w-8 sm:h-10 sm:w-10 text-white/80 hover:bg-white/[0.04]">
              <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
            </Button>
          </Link>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <Crown className="w-6 h-6 text-amber-400" />
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-white">
                Luxury AI Generation
              </h1>
            </div>
            <p className="text-sm sm:text-base text-white/60 mt-1">
              Génération IA spécialisée haute gamme — produits, packagings et designs de luxe
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Generation Form */}
          <div className="lg:col-span-2 space-y-4">
            <Card className="border-white/[0.06] bg-white/[0.03] backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-amber-400" />
                  Créer un design de luxe
                </CardTitle>
                <CardDescription className="text-white/60">
                  Décrivez votre vision et laissez l'IA créer un design haute gamme
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-white/80">Style</Label>
                  <Select value={style} onValueChange={setStyle}>
                    <SelectTrigger className="bg-white/[0.04] border-white/[0.08] text-white mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {LUXURY_STYLES.map((s) => (
                        <SelectItem key={s.value} value={s.value}>
                          <span className="font-medium">{s.label}</span>
                          <span className="text-zinc-400 ml-2 text-xs">— {s.desc}</span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-white/80">Matériaux (optionnel)</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {LUXURY_MATERIALS.map((mat) => (
                      <button
                        key={mat}
                        onClick={() => toggleMaterial(mat)}
                        className={`px-3 py-1.5 rounded-full text-xs transition-all ${
                          materials.includes(mat)
                            ? 'bg-amber-500/30 text-amber-300 border border-amber-500/50'
                            : 'bg-white/[0.04] text-white/60 border border-white/[0.08] hover:bg-white/[0.06]'
                        }`}
                      >
                        {mat}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <Label className="text-white/80">Description du produit</Label>
                  <Textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="Ex: Montre de luxe avec boîtier en or rose, cadran en nacre et bracelet en cuir d'alligator..."
                    className="bg-white/[0.04] border-white/[0.08] text-white mt-1 min-h-[100px]"
                  />
                </div>

                <Button
                  onClick={handleGenerate}
                  disabled={isGenerating || !prompt.trim()}
                  className="w-full bg-gradient-to-r from-amber-600 to-amber-800 hover:from-amber-500 hover:to-amber-700 text-white"
                >
                  {isGenerating ? (
                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Génération en cours...</>
                  ) : (
                    <><Gem className="w-4 h-4 mr-2" /> Générer le design de luxe</>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Results */}
            {results.length > 0 && (
              <Card className="border-white/[0.06] bg-white/[0.03] backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-white">Vos créations ({results.length})</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {results.map((r) => (
                      <div key={r.id} className="relative aspect-square rounded-lg overflow-hidden bg-white/[0.04]">
                        <Image src={r.url} alt={r.prompt} className="w-full h-full object-cover" width={200} height={200} unoptimized />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Side panel */}
          <div className="space-y-4">
            <Card className="border-amber-500/20 bg-gradient-to-b from-amber-900/20 to-transparent">
              <CardHeader>
                <CardTitle className="text-amber-300 flex items-center gap-2">
                  <Star className="w-5 h-5" />
                  Luxury AI
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <p className="text-white/70">
                  Notre moteur IA est spécialement entraîné pour la création de produits haut de gamme.
                </p>
                <ul className="space-y-2 text-white/60">
                  <li className="flex items-start gap-2">
                    <span className="text-amber-400 mt-0.5">•</span>
                    Rendu photo-réaliste qualité studio
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-amber-400 mt-0.5">•</span>
                    Matériaux et textures haute fidélité
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-amber-400 mt-0.5">•</span>
                    Éclairage professionnel automatique
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-amber-400 mt-0.5">•</span>
                    Export HD pour impression et web
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-amber-400 mt-0.5">•</span>
                    Cohérence de marque garantie
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="border-white/[0.06] bg-white/[0.03]">
              <CardHeader>
                <CardTitle className="text-white text-sm">Inspirations récentes</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-xs text-white/50">
                <p>• &ldquo;Parfum haute couture en cristal Baccarat&rdquo;</p>
                <p>• &ldquo;Sac à main cuir autruche coloris champagne&rdquo;</p>
                <p>• &ldquo;Montre tourbillon squelette or rose&rdquo;</p>
                <p>• &ldquo;Bijou Art Déco diamant et platine&rdquo;</p>
                <p>• &ldquo;Packaging coffret joaillerie ébène et or&rdquo;</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

const MemoizedLuxuryAIPageContent = memo(LuxuryAIPageContent);

export default function LuxuryAIPage() {
  return (
    <ErrorBoundary level="page" componentName="LuxuryAIPage">
      <MemoizedLuxuryAIPageContent />
    </ErrorBoundary>
  );
}
