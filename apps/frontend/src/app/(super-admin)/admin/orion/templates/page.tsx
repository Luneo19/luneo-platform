'use client';

/**
 * ORION - Email Template Library (Phase 2 - HERMES)
 * Organized by category: Onboarding, Retention, Revenue, Transactional
 */
import React from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, FileText, Eye, Copy } from 'lucide-react';

interface Template {
  id: string;
  name: string;
  subject: string;
  category: string;
}

const TEMPLATES_BY_CATEGORY: { title: string; color: string; badgeClass: string; templates: Template[] }[] = [
  {
    title: 'Onboarding',
    color: 'text-emerald-400',
    badgeClass: 'border-emerald-500/30 text-emerald-400 bg-emerald-500/10',
    templates: [
      { id: '1', name: 'Welcome Email', subject: 'Bienvenue sur Luneo! 🎉', category: 'onboarding' },
      { id: '2', name: 'Day 3 Follow-up', subject: 'Comment se passe votre experience?', category: 'onboarding' },
      { id: '3', name: 'Feature Discovery', subject: 'Decouvrez ces fonctionnalites', category: 'onboarding' },
      { id: '4', name: 'Week 1 Summary', subject: 'Votre premiere semaine en resume', category: 'onboarding' },
    ],
  },
  {
    title: 'Retention',
    color: 'text-amber-400',
    badgeClass: 'border-amber-500/30 text-amber-400 bg-amber-500/10',
    templates: [
      { id: '5', name: 'Churn Prevention', subject: 'Vous nous manquez!', category: 'retention' },
      { id: '6', name: 'Win-back', subject: 'Revenez avec -20%', category: 'retention' },
      { id: '7', name: 'Re-engagement', subject: 'Nouvelles fonctionnalites a decouvrir', category: 'retention' },
      { id: '8', name: 'NPS Survey', subject: 'Votre avis compte pour nous', category: 'retention' },
    ],
  },
  {
    title: 'Revenue',
    color: 'text-pink-400',
    badgeClass: 'border-pink-500/30 text-pink-400 bg-pink-500/10',
    templates: [
      { id: '9', name: 'Upsell Pro', subject: 'Passez au plan Professional', category: 'revenue' },
      { id: '10', name: 'Cross-sell', subject: 'Completez votre experience', category: 'revenue' },
      { id: '11', name: 'Annual Plan', subject: 'Economisez 20% avec le plan annuel', category: 'revenue' },
      { id: '12', name: 'Trial Ending', subject: 'Votre essai se termine bientot', category: 'revenue' },
    ],
  },
  {
    title: 'Transactional',
    color: 'text-blue-400',
    badgeClass: 'border-blue-500/30 text-blue-400 bg-blue-500/10',
    templates: [
      { id: '13', name: 'Invoice', subject: 'Votre facture Luneo', category: 'transactional' },
      { id: '14', name: 'Payment Confirmation', subject: 'Paiement confirme', category: 'transactional' },
      { id: '15', name: 'Password Reset', subject: 'Reinitialisation de mot de passe', category: 'transactional' },
      { id: '16', name: 'Account Update', subject: 'Mise a jour de votre compte', category: 'transactional' },
    ],
  },
];

export default function TemplatesLibraryPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/admin/orion/communications">
            <Button variant="ghost" size="sm" className="text-zinc-400 hover:text-white hover:bg-zinc-800">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <FileText className="h-6 w-6 text-purple-400" />
              Bibliotheque de Templates
            </h1>
            <p className="text-sm text-zinc-400 mt-1">
              {TEMPLATES_BY_CATEGORY.reduce((sum, cat) => sum + cat.templates.length, 0)} templates disponibles
            </p>
          </div>
        </div>
        <Button className="bg-purple-600 hover:bg-purple-700 text-white">
          Creer un template
        </Button>
      </div>

      {/* Categories */}
      {TEMPLATES_BY_CATEGORY.map((category) => (
        <div key={category.title}>
          <h2 className={`text-lg font-semibold ${category.color} mb-3`}>
            {category.title}
          </h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {category.templates.map((template) => (
              <Card key={template.id} className="border-zinc-700 bg-zinc-800 hover:border-zinc-600 transition-colors">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm text-white">{template.name}</CardTitle>
                    <Badge variant="outline" className={category.badgeClass}>
                      {category.title}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-zinc-400 mb-3 truncate">{template.subject}</p>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" className="h-7 text-xs border-zinc-700 text-zinc-300 hover:bg-zinc-700">
                      <Eye className="h-3 w-3 mr-1" />
                      Preview
                    </Button>
                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-zinc-400 hover:text-white hover:bg-zinc-700">
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
