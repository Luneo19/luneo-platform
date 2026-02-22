/**
 * Header for Projects page
 */

'use client';

import { FolderKanban, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';

interface ProjectsHeaderProps {
  stats: { total: number; active: number };
  search: string;
  onSearchChange: (value: string) => void;
  onCreate: () => void;
}

export function ProjectsHeader({
  stats,
  search,
  onSearchChange,
  onCreate,
}: ProjectsHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-white flex items-center gap-3">
          <FolderKanban className="w-8 h-8 text-cyan-400" />
          Projets
        </h1>
        <p className="text-gray-400 mt-1">
          {stats.total} projet{stats.total > 1 ? 's' : ''} • {stats.active} actif
          {stats.active > 1 ? 's' : ''}
        </p>
      </div>
      <div className="flex items-center gap-3 w-full sm:w-auto">
        <div className="relative flex-1 sm:flex-initial">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Rechercher..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-9 bg-gray-800 border-gray-700 text-white w-full sm:w-56"
          />
        </div>
        <Button onClick={onCreate} className="bg-cyan-600 hover:bg-cyan-700">
          <Plus className="w-4 h-4 mr-2" />
          Nouveau projet
        </Button>
      </div>
    </div>
  );
}
