/**
 * Simple table list for projects
 */

'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Pencil, Trash2, Key, Copy } from 'lucide-react';
import type { Project } from '../types';
import { PROJECT_TYPE_LABELS, PROJECT_STATUS_LABELS } from '../types';

interface ProjectsTableProps {
  projects: Project[];
  onEdit: (project: Project) => void;
  onDelete: (project: Project) => void;
  onRegenerateApiKey?: (project: Project) => void;
}

export function ProjectsTable({
  projects,
  onEdit,
  onDelete,
  onRegenerateApiKey,
}: ProjectsTableProps) {
  const copySlug = (slug: string) => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(slug);
    }
  };

  return (
    <div className="space-y-3">
      {projects.map((project) => (
        <Card
          key={project.id}
          className="bg-gray-800/50 border-gray-700 hover:border-cyan-500/30 transition-colors"
        >
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-semibold text-white truncate">{project.name}</h3>
                  <Badge
                    variant="secondary"
                    className="text-xs bg-gray-700 text-gray-300"
                  >
                    {PROJECT_STATUS_LABELS[project.status] ?? project.status}
                  </Badge>
                  <Badge variant="outline" className="text-xs border-gray-600 text-gray-400">
                    {PROJECT_TYPE_LABELS[project.type] ?? project.type}
                  </Badge>
                </div>
                <p className="text-sm text-gray-400 mt-1 truncate">
                  {project.description || '—'}
                </p>
                <p className="text-xs text-gray-500 mt-1 font-mono">{project.slug}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-gray-400"
                  onClick={() => copySlug(project.slug)}
                >
                  <Copy className="w-4 h-4" />
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="text-gray-400">
                      <MoreHorizontal className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="bg-gray-800 border-gray-700">
                    <DropdownMenuItem onClick={() => onEdit(project)}>
                      <Pencil className="w-4 h-4 mr-2" />
                      Modifier
                    </DropdownMenuItem>
                    {onRegenerateApiKey && project.apiKey && (
                      <DropdownMenuItem onClick={() => onRegenerateApiKey(project)}>
                        <Key className="w-4 h-4 mr-2" />
                        Régénérer la clé API
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem
                      className="text-red-400 focus:text-red-400"
                      onClick={() => onDelete(project)}
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Supprimer
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
