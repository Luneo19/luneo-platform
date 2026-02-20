'use client';

import React, { useState } from 'react';
import { Download, Users, Activity, Target, DollarSign, FileText, Mail } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { endpoints } from '@/lib/api/client';
import { useToast } from '@/hooks/use-toast';

const EXPORT_CARDS = [
  {
    id: 'customers',
    title: 'Clients',
    description: 'Nom, email, plan, date d\'inscription, dernière activité',
    icon: Users,
    estimate: '~2 400',
  },
  {
    id: 'health-scores',
    title: 'Health Scores',
    description: 'Utilisateur, score santé, risque churn, engagement',
    icon: Activity,
    estimate: '~1 800',
  },
  {
    id: 'segments',
    title: 'Segments',
    description: 'Nom, type, nombre d\'utilisateurs, conditions',
    icon: Target,
    estimate: '~120',
  },
  {
    id: 'revenue',
    title: 'Revenus',
    description: 'MRR, ARR, opportunités upsell',
    icon: DollarSign,
    estimate: '~80',
  },
  {
    id: 'audit-logs',
    title: 'Journal d\'Audit',
    description: 'Date, action, utilisateur, ressource',
    icon: FileText,
    estimate: '~15 000',
  },
  {
    id: 'communications',
    title: 'Communications',
    description: 'Emails envoyés, taux d\'ouverture, campagnes',
    icon: Mail,
    estimate: '~350',
  },
];

type RecentExport = {
  id: string;
  type: string;
  format: string;
  date: string;
  rows: number;
};

export default function ExportPage() {
  const { toast } = useToast();
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [formatByCard, setFormatByCard] = useState<Record<string, 'csv' | 'json'>>({});
  const [loadingCard, setLoadingCard] = useState<string | null>(null);
  const [recentExports, setRecentExports] = useState<RecentExport[]>([]);

  const getFormat = (id: string) => formatByCard[id] ?? 'csv';
  const setFormat = (id: string, format: 'csv' | 'json') => {
    setFormatByCard((prev) => ({ ...prev, [id]: format }));
  };

  const handleDownload = async (type: string) => {
    setLoadingCard(type);
    const format = getFormat(type);
    try {
      const data = await endpoints.orion.export(type, {
        format,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
        limit: 5000,
      });
      if (typeof data === 'string') {
        const blob = new Blob([data], { type: format === 'csv' ? 'text/csv' : 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `orion-export-${type}-${new Date().toISOString().slice(0, 10)}.${format === 'csv' ? 'csv' : 'json'}`;
        a.click();
        URL.revokeObjectURL(url);
      } else if (data && typeof data === 'object' && 'data' in data) {
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `orion-export-${type}-${new Date().toISOString().slice(0, 10)}.json`;
        a.click();
        URL.revokeObjectURL(url);
      }
      const rowCount = Array.isArray((data as { data?: unknown[] })?.data) ? (data as { data: unknown[] }).data.length : 0;
      setRecentExports((prev) => [
        { id: `e-${Date.now()}`, type, format: format.toUpperCase(), date: new Date().toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' }), rows: rowCount },
        ...prev.slice(0, 4),
      ]);
    } catch {
      toast({
        title: 'Erreur d\'export',
        description: 'Impossible de télécharger l\'export. Vérifiez votre connexion et réessayez.',
        variant: 'destructive',
      });
    } finally {
      setLoadingCard(null);
    }
  };

  return (
    <div className="space-y-8 text-zinc-100">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-zinc-800 border border-zinc-700">
          <Download className="h-8 w-8 text-amber-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-zinc-100">Centre d&apos;Export</h1>
          <p className="text-zinc-400 text-sm">
            Exportez clients, health scores, segments, revenus et journaux
          </p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {EXPORT_CARDS.map((card) => {
          const Icon = card.icon;
          const format = getFormat(card.id);
          return (
            <Card key={card.id} className="bg-zinc-800/80 border-zinc-700">
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <Icon className="h-5 w-5 text-amber-400" />
                  <CardTitle className="text-zinc-100 text-base">{card.title}</CardTitle>
                </div>
                <CardDescription className="text-zinc-400 text-sm">
                  {card.description}
                </CardDescription>
                <p className="text-xs text-zinc-500">~{card.estimate} enregistrements</p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-zinc-400 text-xs">Format</Label>
                  <Select value={format} onValueChange={(v) => setFormat(card.id, v as 'csv' | 'json')}>
                    <SelectTrigger className="bg-zinc-700 border-zinc-600 text-zinc-100">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="csv">CSV</SelectItem>
                      <SelectItem value="json">JSON</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-zinc-400 text-xs">Période (optionnel)</Label>
                  <DateRangePicker
                    from={dateFrom}
                    to={dateTo}
                    onFromChange={setDateFrom}
                    onToChange={setDateTo}
                  />
                </div>
                <Button
                  className="w-full bg-amber-600 hover:bg-amber-700 text-white"
                  onClick={() => handleDownload(card.id)}
                  disabled={loadingCard === card.id}
                >
                  {loadingCard === card.id ? (
                    'Téléchargement…'
                  ) : (
                    <>
                      <Download className="h-4 w-4 mr-2" />
                      Télécharger
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card className="bg-zinc-800/80 border-zinc-700">
        <CardHeader>
          <CardTitle className="text-zinc-100">Exports récents</CardTitle>
          <CardDescription className="text-zinc-400">
            Derniers exports téléchargés avec succès (session en cours)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {recentExports.length === 0 ? (
            <p className="text-zinc-500 text-sm py-4">Aucun export récent. Lancez un téléchargement ci‑dessus.</p>
          ) : (
          <ul className="space-y-2">
            {recentExports.map((exp) => (
              <li
                key={exp.id}
                className="flex items-center justify-between py-2 px-3 rounded-lg bg-zinc-700/50 border border-zinc-600"
              >
                <div className="flex items-center gap-3">
                  <FileText className="h-4 w-4 text-zinc-500" />
                  <span className="text-zinc-200 font-medium">{exp.type}</span>
                  <span className="text-zinc-500 text-sm">{exp.format}</span>
                  <span className="text-zinc-500 text-sm">{exp.date}</span>
                  {exp.rows > 0 && (
                    <span className="text-zinc-500 text-xs">~{exp.rows} lignes</span>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-amber-400 hover:text-amber-300 hover:bg-zinc-600"
                  onClick={() => handleDownload(exp.type)}
                >
                  Télécharger
                </Button>
              </li>
            ))}
          </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
