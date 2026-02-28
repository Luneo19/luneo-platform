/**
 * ★★★ ADMIN EMAIL TEMPLATES PAGE ★★★
 * Gestion des templates email pour le Super Admin
 * ✅ Données réelles depuis l'API backend (orion/communications/templates)
 */

'use client';

import React, { useState, useCallback } from 'react';
import useSWR from 'swr';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { FileText, Search, Plus, Eye, Edit, Trash2, RefreshCw, Loader2 } from 'lucide-react';
import { logger } from '@/lib/logger';

interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  category?: string;
  variables?: string[];
  createdAt: string;
  updatedAt: string;
}

async function fetcher(url: string) {
  const res = await fetch(url, { credentials: 'include' });
  if (!res.ok) throw new Error('Failed to fetch');
  const raw = await res.json();
  return raw.data ?? raw;
}

export default function TemplatesPage() {
  const [search, setSearch] = useState('');
  const { data, isLoading, error, mutate } = useSWR<EmailTemplate[]>(
    '/api/admin/marketing/templates',
    fetcher,
    { revalidateOnFocus: true }
  );

  const templates = data || [];
  const filteredTemplates = templates.filter(
    (t) =>
      t.name?.toLowerCase().includes(search.toLowerCase()) ||
      t.subject?.toLowerCase().includes(search.toLowerCase()) ||
      t.category?.toLowerCase().includes(search.toLowerCase())
  );

  const handleDelete = useCallback(
    async (id: string) => {
      if (!confirm('Supprimer ce template ?')) return;
      try {
        await fetch(`/api/admin/marketing/templates/${id}`, {
          method: 'DELETE',
          credentials: 'include',
        });
        mutate();
      } catch (err) {
        logger.error('Failed to delete template', { error: err });
      }
    },
    [mutate]
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <FileText className="w-8 h-8 text-purple-400" />
            Email Templates
          </h1>
          <p className="text-white/80 mt-2">
            Manage email templates for automated communications
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => mutate()}
            className="bg-zinc-900 border-zinc-700 text-zinc-100 hover:bg-zinc-800"
          >
            <RefreshCw className="w-4 h-4 mr-1" />
            Refresh
          </Button>
          <Button size="sm" className="bg-purple-600 hover:bg-purple-700">
            <Plus className="w-4 h-4 mr-1" />
            New Template
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/70" />
        <Input
          placeholder="Search templates..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10 bg-white/[0.03] border-white/[0.06] text-white placeholder:text-white/30"
        />
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 text-purple-400 animate-spin" />
          <span className="ml-3 text-white/80">Loading templates...</span>
        </div>
      )}

      {/* Error State */}
      {error && !isLoading && (
        <Card className="bg-red-500/10 border-red-500/20">
          <CardContent className="p-6 text-center">
            <p className="text-red-400">Failed to load templates. Backend may not be available.</p>
            <Button
              variant="outline"
              size="sm"
              className="mt-3 bg-zinc-900 border-zinc-700 text-zinc-100 hover:bg-zinc-800"
              onClick={() => mutate()}
            >
              Retry
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Templates Grid */}
      {!isLoading && !error && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredTemplates.length === 0 ? (
            <Card className="col-span-full bg-white/[0.02] border-white/[0.06]">
              <CardContent className="p-12 text-center">
                <FileText className="w-12 h-12 mx-auto text-white/20 mb-4" />
                <p className="text-white/70">
                  {search ? 'No templates match your search' : 'No email templates yet'}
                </p>
              </CardContent>
            </Card>
          ) : (
            filteredTemplates.map((template) => (
              <Card
                key={template.id}
                className="bg-white/[0.03] border-white/[0.06] hover:border-purple-500/30 transition-colors"
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-white text-sm font-medium truncate">
                      {template.name}
                    </CardTitle>
                    {template.category && (
                      <Badge variant="secondary" className="bg-purple-500/20 text-purple-300 text-xs">
                        {template.category}
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-white/75 text-sm truncate">{template.subject}</p>
                  {template.variables && template.variables.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {template.variables.map((v) => (
                        <Badge key={v} variant="outline" className="text-xs text-white/70 border-white/10">
                          {`{{${v}}}`}
                        </Badge>
                      ))}
                    </div>
                  )}
                  <div className="flex items-center justify-between pt-2 border-t border-white/[0.06]">
                    <span className="text-xs text-white/30">
                      {new Date(template.updatedAt).toLocaleDateString()}
                    </span>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-white/70 hover:text-white">
                        <Eye className="w-3.5 h-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-white/70 hover:text-white">
                        <Edit className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-white/70 hover:text-red-400"
                        onClick={() => handleDelete(template.id)}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}
    </div>
  );
}
