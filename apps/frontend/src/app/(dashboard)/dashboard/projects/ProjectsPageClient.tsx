/**
 * Client component for Projects page
 */

'use client';

import { useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { ProjectsHeader } from './components/ProjectsHeader';
import { ProjectsStats } from './components/ProjectsStats';
import { ProjectsTable } from './components/ProjectsTable';
import { ProjectsEmptyState } from './components/ProjectsEmptyState';
import { CreateProjectModal } from './components/modals/CreateProjectModal';
import { EditProjectModal } from './components/modals/EditProjectModal';
import { useProjects } from './hooks/useProjects';
import type { Project, CreateProjectPayload } from './types';

export function ProjectsPageClient() {
  const { toast } = useToast();
  const [filters, setFilters] = useState({ search: '', type: 'all', status: 'all' });
  const [page, setPage] = useState(1);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);

  const {
    projects,
    stats,
    isLoading,
    refetch,
    createProject,
    updateProject,
    deleteProject,
    regenerateApiKey,
  } = useProjects(filters, page);

  const handleCreate = useCallback(
    async (data: CreateProjectPayload) => {
      try {
        await createProject(data);
        toast({ title: 'Projet créé', description: 'Le projet a été créé avec succès.' });
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Erreur lors de la création';
        toast({ title: 'Erreur', description: message, variant: 'destructive' });
        throw err;
      }
    },
    [createProject, toast]
  );

  const handleUpdate = useCallback(
    async (id: string, data: Parameters<typeof updateProject>[1]) => {
      try {
        await updateProject({ id, data });
        toast({ title: 'Projet mis à jour', description: 'Les modifications ont été enregistrées.' });
        setShowEditModal(false);
        setEditingProject(null);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Erreur lors de la mise à jour';
        toast({ title: 'Erreur', description: message, variant: 'destructive' });
        throw err;
      }
    },
    [updateProject, toast]
  );

  const handleDelete = useCallback(
    async (project: Project) => {
      if (!confirm(`Supprimer le projet « ${project.name } » ? Cette action est irréversible.`)) return;
      try {
        await deleteProject(project.id);
        toast({ title: 'Projet supprimé', description: 'Le projet a été archivé.' });
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Erreur lors de la suppression';
        toast({ title: 'Erreur', description: message, variant: 'destructive' });
      }
    },
    [deleteProject, toast]
  );

  const handleRegenerateApiKey = useCallback(
    async (project: Project) => {
      if (!confirm('Régénérer la clé API ? L’ancienne clé ne fonctionnera plus.')) return;
      try {
        await regenerateApiKey(project.id);
        toast({ title: 'Clé API régénérée', description: 'Une nouvelle clé a été générée.' });
        refetch();
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Erreur';
        toast({ title: 'Erreur', description: message, variant: 'destructive' });
      }
    },
    [regenerateApiKey, toast, refetch]
  );

  const hasFilters = Boolean(filters.search || filters.type !== 'all' || filters.status !== 'all');

  if (isLoading && projects.length === 0) {
    return (
      <div className="space-y-6 pb-10">
        <div className="dash-card h-16 rounded-2xl animate-pulse border-white/[0.06] bg-white/[0.03]" />
        <div className="grid grid-cols-2 gap-4">
          <div className="dash-card h-24 rounded-2xl animate-pulse border-white/[0.06] bg-white/[0.03]" />
          <div className="dash-card h-24 rounded-2xl animate-pulse border-white/[0.06] bg-white/[0.03]" />
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="dash-card h-20 rounded-2xl animate-pulse border-white/[0.06] bg-white/[0.03]" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-10">
      <ProjectsHeader
        stats={stats}
        search={filters.search}
        onSearchChange={(search) => setFilters((f) => ({ ...f, search }))}
        onCreate={() => setShowCreateModal(true)}
      />
      <ProjectsStats total={stats.total} active={stats.active} />

      {projects.length === 0 ? (
        <ProjectsEmptyState
          hasFilters={hasFilters}
          onCreate={() => setShowCreateModal(true)}
          onResetFilters={() => setFilters({ search: '', type: 'all', status: 'all' })}
        />
      ) : (
        <ProjectsTable
          projects={projects}
          onEdit={(project) => {
            setEditingProject(project);
            setShowEditModal(true);
          }}
          onDelete={handleDelete}
          onRegenerateApiKey={handleRegenerateApiKey}
        />
      )}

      <CreateProjectModal
        open={showCreateModal}
        onOpenChange={setShowCreateModal}
        onCreate={handleCreate}
      />
      <EditProjectModal
        open={showEditModal}
        onOpenChange={(open) => {
          setShowEditModal(open);
          if (!open) setEditingProject(null);
        }}
        project={editingProject}
        onUpdate={handleUpdate}
      />
    </div>
  );
}
