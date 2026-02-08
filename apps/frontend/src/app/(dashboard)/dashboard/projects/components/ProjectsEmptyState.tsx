/**
 * Empty state for Projects page
 */

'use client';

import { EmptyState } from '@/components/ui/empty-states/EmptyState';
import { FolderKanban } from 'lucide-react';

interface ProjectsEmptyStateProps {
  hasFilters: boolean;
  onCreate: () => void;
  onResetFilters: () => void;
}

export function ProjectsEmptyState({
  hasFilters,
  onCreate,
  onResetFilters,
}: ProjectsEmptyStateProps) {
  return (
    <EmptyState
      icon={<FolderKanban className="w-16 h-16" />}
      title={hasFilters ? 'Aucun projet trouvé' : 'Aucun projet'}
      description={
        hasFilters
          ? 'Essayez de modifier votre recherche ou les filtres'
          : 'Créez votre premier projet pour organiser vos workspaces'
      }
      action={{
        label: hasFilters ? 'Effacer les filtres' : 'Créer un projet',
        onClick: hasFilters ? onResetFilters : onCreate,
      }}
    />
  );
}
