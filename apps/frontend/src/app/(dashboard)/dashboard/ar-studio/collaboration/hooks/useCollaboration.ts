/**
 * Hook personnalisé pour gérer la collaboration AR
 */

import { useState, useEffect, useMemo } from 'react';
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

  useEffect(() => {
    fetchProjects();
    fetchMembers();
    fetchComments();
    fetchActivities();
  }, []);

  const fetchProjects = async () => {
    try {
      const data = await api.get<{ data?: unknown[]; projects?: unknown[] }>('/api/v1/ar-studio/collaboration/projects');
      const raw = data?.data ?? data?.projects ?? [];
      if (Array.isArray(raw) && raw.length > 0) {
        const transformed: CollaborationProject[] = raw.map(
          (p: any) => ({
            id: p.id,
            name: p.name || 'Projet sans nom',
            description: p.description || '',
            thumbnail: p.thumbnail || p.thumbnailUrl,
            members: p.members || [],
            modelCount: p.modelCount || 0,
            createdAt: p.createdAt ? new Date(p.createdAt) : new Date(),
            updatedAt: p.updatedAt ? new Date(p.updatedAt) : new Date(),
            ownerId: p.ownerId || p.owner_id,
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
  };

  const fetchMembers = async () => {
    try {
      const data = await api.get<{ data?: unknown[]; members?: unknown[] }>('/api/v1/ar-studio/collaboration/members');
      const raw = (data?.data ?? data?.members ?? []) as Record<string, unknown>[];
      const transformed: CollaborationMember[] = raw.map((m) => ({
        id: m.id as string,
        userId: (m.userId as string) || (m.user_id as string),
        name: (m.name as string) || 'Utilisateur',
        email: (m.email as string) || '',
        avatar: (m.avatar as string) || (m.avatarUrl as string),
        role: ((m.role as string) || 'viewer') as CollaborationMember['role'],
        status: ((m.status as string) || 'active') as CollaborationMember['status'],
        joinedAt: m.joinedAt ? new Date(m.joinedAt as string) : new Date(),
        lastActive: m.lastActive ? new Date(m.lastActive as string) : undefined,
      }));
      setMembers(transformed);
    } catch (error) {
      logger.error('Failed to fetch members', { error });
    }
  };

  const fetchComments = async () => {
    try {
      const data = await api.get<{ data?: CollaborationComment[]; comments?: CollaborationComment[] }>(
        '/api/v1/ar-studio/collaboration/comments',
        selectedProject ? { params: { projectId: selectedProject } } : {}
      );
      setComments(data?.data ?? data?.comments ?? []);
    } catch (error) {
      logger.error('Failed to fetch comments', { error });
    }
  };

  const fetchActivities = async () => {
    try {
      const data = await api.get<{ data?: CollaborationActivity[]; activities?: CollaborationActivity[] }>(
        '/api/v1/ar-studio/collaboration/activities',
        selectedProject ? { params: { projectId: selectedProject } } : {}
      );
      setActivities(data?.data ?? data?.activities ?? []);
    } catch (error) {
      logger.error('Failed to fetch activities', { error });
    }
  };

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
    try {
      await api.post('/api/v1/ar-studio/collaboration/invite', { email, role });
      await fetchMembers();
      return { success: true };
    } catch (error) {
      logger.error('Failed to invite member', { error });
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
    refetch: fetchProjects,
  };
}



