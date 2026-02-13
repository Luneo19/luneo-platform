/**
 * Hook personnalisé pour gérer la collaboration AR
 * Uses project-scoped endpoints: /api/v1/ar-studio/projects/:projectId/...
 */

import { useState, useEffect, useMemo, useCallback } from 'react';
import { api } from '@/lib/api/client';
import { logger } from '@/lib/logger';
import type {
  CollaborationProject,
  CollaborationMember,
  CollaborationComment,
  CollaborationActivity,
  CollaborationRole,
} from '../types';

export function useCollaboration() {
  const [projects, setProjects] = useState<CollaborationProject[]>([]);
  const [members, setMembers] = useState<CollaborationMember[]>([]);
  const [comments, setComments] = useState<CollaborationComment[]>([]);
  const [activities, setActivities] = useState<CollaborationActivity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedProject, setSelectedProject] = useState<string | null>(null);

  const fetchProjects = useCallback(async () => {
    try {
      const data = await api.get<{ data?: unknown[]; projects?: unknown[] }>('/api/v1/ar-studio/collaboration/projects');
      const raw = data?.data ?? data?.projects ?? [];
      if (Array.isArray(raw) && raw.length > 0) {
        const items = raw as Record<string, unknown>[];
        const transformed: CollaborationProject[] = items.map(
          (p) => ({
            id: p.id as string,
            name: (p.name as string) || 'Projet sans nom',
            description: (p.description as string) || '',
            thumbnail: (p.thumbnail as string) || (p.thumbnailUrl as string),
            members: (p.members as CollaborationMember[]) || [],
            modelCount: (p.modelCount as number) || (p.modelIds as string[])?.length || 0,
            createdAt: p.createdAt ? new Date(p.createdAt as string) : new Date(),
            updatedAt: p.updatedAt ? new Date(p.updatedAt as string) : new Date(),
            ownerId: (p.ownerId as string) || (p.createdBy as string) || '',
          })
        );
        setProjects(transformed);
      } else {
        setProjects([]);
      }
    } catch (error) {
      logger.error('Failed to fetch projects', { error });
      setProjects([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchMembers = useCallback(async (projectId: string | null) => {
    if (!projectId) {
      setMembers([]);
      return;
    }
    try {
      const data = await api.get<{ success?: boolean; data?: { members?: unknown[] } }>(
        `/api/v1/ar-studio/projects/${projectId}/members`
      );
      const raw = (data?.data?.members ?? []) as Record<string, unknown>[];
      const transformed: CollaborationMember[] = raw.map((m) => {
        const user = m.user as Record<string, unknown> | undefined;
        const name = user
          ? [user.firstName, user.lastName].filter(Boolean).join(' ') || (user.email as string) || 'Utilisateur'
          : 'Utilisateur';
        return {
          id: (m.userId as string) || (m.user_id as string),
          userId: (m.userId as string) || (m.user_id as string),
          name,
          email: (user?.email as string) || '',
          avatar: (m.avatar as string) || (m.avatarUrl as string),
          role: ((m.role as string) || 'viewer') as CollaborationMember['role'],
          status: 'active' as const,
          joinedAt: m.joinedAt ? new Date(m.joinedAt as string) : new Date(),
          lastActive: m.lastActive ? new Date(m.lastActive as string) : undefined,
        };
      });
      setMembers(transformed);
    } catch (error) {
      logger.error('Failed to fetch members', { error });
      setMembers([]);
    }
  }, []);

  const fetchComments = useCallback(async (projectId: string | null) => {
    if (!projectId) {
      setComments([]);
      return;
    }
    try {
      const data = await api.get<{ success?: boolean; data?: { comments?: unknown[] } }>(
        `/api/v1/ar-studio/projects/${projectId}/comments`
      );
      const raw = (data?.data?.comments ?? []) as Record<string, unknown>[];
      const transformed: CollaborationComment[] = raw.map((c) => ({
        id: c.id as string,
        projectId: c.projectId as string,
        userId: c.userId as string,
        userName: 'User',
        content: c.content as string,
        createdAt: c.createdAt ? new Date(c.createdAt as string) : new Date(),
      }));
      setComments(transformed);
    } catch (error) {
      logger.error('Failed to fetch comments', { error });
      setComments([]);
    }
  }, []);

  const fetchActivities = useCallback(async (projectId: string | null) => {
    if (!projectId) {
      setActivities([]);
      return;
    }
    try {
      const data = await api.get<{ success?: boolean; data?: { activities?: unknown[] } }>(
        `/api/v1/ar-studio/projects/${projectId}/activities`
      );
      const raw = (data?.data?.activities ?? []) as Record<string, unknown>[];
      const transformed: CollaborationActivity[] = raw.map((a) => ({
        id: a.id as string,
        projectId,
        userId: a.userId as string,
        userName: 'User',
        action: (a.type as string) || 'activity',
        target: (a.metadata as Record<string, unknown>)?.role as string | undefined,
        createdAt: a.createdAt ? new Date(a.createdAt as string) : new Date(),
      }));
      setActivities(transformed);
    } catch (error) {
      logger.error('Failed to fetch activities', { error });
      setActivities([]);
    }
  }, []);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  useEffect(() => {
    fetchMembers(selectedProject);
    fetchComments(selectedProject);
    fetchActivities(selectedProject);
  }, [selectedProject, fetchMembers, fetchComments, fetchActivities]);

  const stats = useMemo(() => {
    return {
      totalProjects: projects.length,
      totalMembers: members.length,
      activeMembers: members.filter((m) => m.status === 'active').length,
      totalComments: comments.length,
      totalActivities: activities.length,
    };
  }, [projects, members, comments, activities]);

  const inviteMember = async (email: string, role: CollaborationRole) => {
    if (!selectedProject) {
      logger.error('Cannot invite: no project selected');
      return { success: false, error: 'Select a project first' };
    }
    try {
      await api.post(`/api/v1/ar-studio/projects/${selectedProject}/invite`, { email, role });
      await fetchMembers(selectedProject);
      return { success: true };
    } catch (error) {
      logger.error('Failed to invite member', { error });
      return { success: false, error: 'Network error' };
    }
  };

  const addComment = async (content: string) => {
    if (!selectedProject) {
      logger.error('Cannot add comment: no project selected');
      return { success: false, error: 'Select a project first' };
    }
    try {
      await api.post(`/api/v1/ar-studio/projects/${selectedProject}/comments`, { content });
      await fetchComments(selectedProject);
      return { success: true };
    } catch (error) {
      logger.error('Failed to add comment', { error });
      return { success: false, error: 'Network error' };
    }
  };

  return {
    projects,
    members,
    comments,
    activities,
    stats,
    isLoading,
    selectedProject,
    setSelectedProject,
    inviteMember,
    addComment,
    refetch: fetchProjects,
  };
}



