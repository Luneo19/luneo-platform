'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { formatNumber, formatPrice } from '@/lib/utils/formatters';
import { Copy, Edit, Eye, Plus, Settings, Trash2 } from 'lucide-react';
import type { AffiliateLink } from '../types';

interface LinksTabProps {
  links: AffiliateLink[];
  onCreateLink: () => void;
  onCopyLink: (link: AffiliateLink) => void;
}

export function LinksTab({ links, onCreateLink, onCopyLink }: LinksTabProps) {
  return (
    <Card className="bg-gray-50 border-gray-200">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-gray-900">Liens de parrainage</CardTitle>
            <CardDescription className="text-gray-600">
              Gérez vos liens de parrainage et suivez leurs performances
            </CardDescription>
          </div>
          <Button onClick={onCreateLink} className="bg-purple-600 hover:bg-purple-700">
            <Plus className="w-4 h-4 mr-2" />
            Créer un lien
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {links.map((link) => (
            <Card key={link.id} className="bg-gray-100 border-gray-200">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">{link.name || link.code}</h3>
                      <Badge variant={link.isActive ? 'default' : 'secondary'}>
                        {link.isActive ? 'Actif' : 'Inactif'}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 mb-4">
                      <code className="px-3 py-1.5 bg-gray-100 rounded text-sm text-cyan-400 font-mono">
                        {link.url}
                      </code>
                      <Button size="sm" variant="outline" onClick={() => onCopyLink(link)} className="border-gray-600">
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>
                    <div className="grid grid-cols-4 gap-4">
                      <div>
                        <p className="text-sm text-gray-600">Clics</p>
                        <p className="text-xl font-bold text-gray-900">{formatNumber(link.clicks)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Conversions</p>
                        <p className="text-xl font-bold text-purple-400">{formatNumber(link.conversions)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Revenus</p>
                        <p className="text-xl font-bold text-green-400">{formatPrice(link.revenue)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Taux conv.</p>
                        <p className="text-xl font-bold text-cyan-400">
                          {link.clicks > 0 ? ((link.conversions / link.clicks) * 100).toFixed(1) : 0}%
                        </p>
                      </div>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <Settings className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="bg-gray-100 border-gray-200">
                      <DropdownMenuItem>
                        <Edit className="w-4 h-4 mr-2" />
                        Modifier
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Eye className="w-4 h-4 mr-2" />
                        Voir analytics
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="text-red-400">
                        <Trash2 className="w-4 h-4 mr-2" />
                        Supprimer
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
