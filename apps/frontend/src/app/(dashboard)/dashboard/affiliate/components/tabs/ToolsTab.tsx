'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import {
  BarChart3,
  Code,
  Copy,
  Download,
  ExternalLink,
  Eye,
  Image as ImageIcon,
  Mail,
  Plus,
  Share2,
  Sparkles,
} from 'lucide-react';

const BANNER_SIZES = ['728x90', '300x250', '468x60', '250x250', '160x600', '320x50'];
const EMAIL_TEMPLATES = ['Email de bienvenue', 'Rappel parrainage', 'Succès conversion', 'Offre spéciale', 'Newsletter'];
const SOCIAL_PLATFORMS = [
  { platform: 'Twitter', icon: '𝕏', charLimit: 280 },
  { platform: 'Facebook', icon: '📘', charLimit: 5000 },
  { platform: 'LinkedIn', icon: '💼', charLimit: 3000 },
  { platform: 'Instagram', icon: '📷', charLimit: 2200 },
];

export function ToolsTab() {
  const { toast } = useToast();

  const copyHtml = () => {
    navigator.clipboard.writeText('<a href="https://luneo.com?ref=REF123" target="_blank">Découvrez Luneo</a>');
    toast({ title: 'Code copié', description: 'Le code HTML a été copié' });
  };
  const copyJs = () => {
    navigator.clipboard.writeText("const affiliateLink = 'https://luneo.com?ref=REF123';\nwindow.open(affiliateLink, '_blank');");
    toast({ title: 'Code copié', description: 'Le code JavaScript a été copié' });
  };
  const copyReact = () => {
    navigator.clipboard.writeText("import { Link } from 'react-router-dom';\n\n<Link to=\"https://luneo.com?ref=REF123\" target=\"_blank\">\n  Découvrez Luneo\n</Link>");
    toast({ title: 'Code copié', description: 'Le code React a été copié' });
  };
  const copyWordpress = () => {
    navigator.clipboard.writeText('[luneo_affiliate code="REF123"]');
    toast({ title: 'Code copié', description: 'Le shortcode WordPress a été copié' });
  };

  return (
    <div className="space-y-6">
      <div className="grid md:grid-cols-2 gap-6">
        <Card className="bg-gray-800/50 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <ImageIcon className="w-5 h-5 text-purple-400" />
              Bannières
            </CardTitle>
            <CardDescription className="text-gray-400">Téléchargez des bannières pour promouvoir Luneo</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {BANNER_SIZES.map((size) => (
                <div key={size} className="flex items-center justify-between p-3 bg-gray-900/50 rounded-lg hover:bg-gray-900 transition-colors">
                  <div>
                    <p className="text-sm font-medium text-white">Bannière {size}</p>
                    <p className="text-xs text-gray-400">PNG, JPG, SVG</p>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" className="border-gray-600">
                      <Eye className="w-4 h-4 mr-2" />
                      Prévisualiser
                    </Button>
                    <Button size="sm" variant="outline" className="border-gray-600">
                      <Download className="w-4 h-4 mr-2" />
                      Télécharger
                    </Button>
                  </div>
                </div>
              ))}
            </div>
            <Separator className="my-4 bg-gray-700" />
            <div className="space-y-2">
              <Label className="text-gray-300">Générer une bannière personnalisée</Label>
              <div className="flex gap-2">
                <Input placeholder="Texte personnalisé" className="bg-gray-900 border-gray-600 text-white flex-1" />
                <Button variant="outline" className="border-gray-600">
                  <Sparkles className="w-4 h-4 mr-2" />
                  Générer
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800/50 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Mail className="w-5 h-5 text-purple-400" />
              Templates Email
            </CardTitle>
            <CardDescription className="text-gray-400">Modèles d&apos;emails pour vos campagnes</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {EMAIL_TEMPLATES.map((template) => (
                <div key={template} className="flex items-center justify-between p-3 bg-gray-900/50 rounded-lg hover:bg-gray-900 transition-colors">
                  <div>
                    <p className="text-sm font-medium text-white">{template}</p>
                    <p className="text-xs text-gray-400">HTML, TXT, Markdown</p>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" className="border-gray-600">
                      <Eye className="w-4 h-4 mr-2" />
                      Prévisualiser
                    </Button>
                    <Button size="sm" variant="outline" className="border-gray-600">
                      <Download className="w-4 h-4 mr-2" />
                      Télécharger
                    </Button>
                  </div>
                </div>
              ))}
            </div>
            <Separator className="my-4 bg-gray-700" />
            <div className="space-y-2">
              <Label className="text-gray-300">Créer un template personnalisé</Label>
              <Textarea placeholder="Contenu de l'email..." className="bg-gray-900 border-gray-600 text-white min-h-[100px]" />
              <Button className="w-full bg-purple-600 hover:bg-purple-700">
                <Plus className="w-4 h-4 mr-2" />
                Créer le template
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-gray-800/50 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Code className="w-5 h-5 text-purple-400" />
            Snippets de code
          </CardTitle>
          <CardDescription className="text-gray-400">Intégrez facilement vos liens de parrainage</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="html" className="space-y-4">
            <TabsList className="bg-gray-900/50 border border-gray-700">
              <TabsTrigger value="html">HTML</TabsTrigger>
              <TabsTrigger value="js">JavaScript</TabsTrigger>
              <TabsTrigger value="react">React</TabsTrigger>
              <TabsTrigger value="wordpress">WordPress</TabsTrigger>
            </TabsList>
            <TabsContent value="html" className="space-y-4">
              <div>
                <Label className="text-gray-300 mb-2 block">Code HTML</Label>
                <div className="relative">
                  <code className="block p-4 bg-gray-900 rounded-lg text-sm text-cyan-400 font-mono overflow-x-auto">
                    {`<a href="https://luneo.com?ref=REF123" target="_blank">
  Découvrez Luneo
</a>`}
                  </code>
                  <Button size="sm" variant="outline" className="absolute top-2 right-2 border-gray-600" onClick={copyHtml}>
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </TabsContent>
            <TabsContent value="js" className="space-y-4">
              <div>
                <Label className="text-gray-300 mb-2 block">Code JavaScript</Label>
                <div className="relative">
                  <code className="block p-4 bg-gray-900 rounded-lg text-sm text-cyan-400 font-mono overflow-x-auto">
                    {`const affiliateLink = 'https://luneo.com?ref=REF123';
window.open(affiliateLink, '_blank');`}
                  </code>
                  <Button size="sm" variant="outline" className="absolute top-2 right-2 border-gray-600" onClick={copyJs}>
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </TabsContent>
            <TabsContent value="react" className="space-y-4">
              <div>
                <Label className="text-gray-300 mb-2 block">Code React</Label>
                <div className="relative">
                  <code className="block p-4 bg-gray-900 rounded-lg text-sm text-cyan-400 font-mono overflow-x-auto">
                    {`import { Link } from 'react-router-dom';

<Link to="https://luneo.com?ref=REF123" target="_blank">
  Découvrez Luneo
</Link>`}
                  </code>
                  <Button size="sm" variant="outline" className="absolute top-2 right-2 border-gray-600" onClick={copyReact}>
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </TabsContent>
            <TabsContent value="wordpress" className="space-y-4">
              <div>
                <Label className="text-gray-300 mb-2 block">Shortcode WordPress</Label>
                <div className="relative">
                  <code className="block p-4 bg-gray-900 rounded-lg text-sm text-cyan-400 font-mono overflow-x-auto">
                    {`[luneo_affiliate code="REF123"]`}
                  </code>
                  <Button size="sm" variant="outline" className="absolute top-2 right-2 border-gray-600" onClick={copyWordpress}>
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <Card className="bg-gray-800/50 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Share2 className="w-5 h-5 text-purple-400" />
            Templates Réseaux Sociaux
          </CardTitle>
          <CardDescription className="text-gray-400">Messages pré-rédigés pour vos réseaux sociaux</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {SOCIAL_PLATFORMS.map((platform) => (
              <div key={platform.platform} className="p-4 bg-gray-900/50 rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{platform.icon}</span>
                    <span className="font-medium text-white">{platform.platform}</span>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    Max {platform.charLimit} caractères
                  </Badge>
                </div>
                <Textarea
                  placeholder={`Message pour ${platform.platform}...`}
                  className="bg-gray-800 border-gray-600 text-white min-h-[100px] mb-2"
                  maxLength={platform.charLimit}
                />
                <div className="flex items-center justify-between">
                  <p className="text-xs text-gray-400">
                    Utilisez {'{{LINK}}'} pour insérer votre lien automatiquement
                  </p>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" className="border-gray-600">
                      <Copy className="w-4 h-4 mr-2" />
                      Copier
                    </Button>
                    <Button size="sm" variant="outline" className="border-gray-600">
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Partager
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="bg-gray-800/50 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-purple-400" />
            Outils d&apos;Analytics
          </CardTitle>
          <CardDescription className="text-gray-400">Suivez les performances de vos campagnes</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="p-4 bg-gray-900/50 rounded-lg">
              <h4 className="font-medium text-white mb-2">Google Analytics</h4>
              <p className="text-sm text-gray-400 mb-3">Intégrez vos liens avec Google Analytics pour un suivi avancé</p>
              <Button size="sm" variant="outline" className="border-gray-600 w-full">
                <ExternalLink className="w-4 h-4 mr-2" />
                Configurer
              </Button>
            </div>
            <div className="p-4 bg-gray-900/50 rounded-lg">
              <h4 className="font-medium text-white mb-2">UTM Parameters</h4>
              <p className="text-sm text-gray-400 mb-3">Générez des liens avec paramètres UTM pour un meilleur tracking</p>
              <Button size="sm" variant="outline" className="border-gray-600 w-full">
                <Code className="w-4 h-4 mr-2" />
                Générer
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
