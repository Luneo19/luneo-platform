/**
 * Hook personnalisé pour gérer la collaboration AR
 */

import { useState, useEffect, useMemo } from 'react';
import { logger } from '@/lib/logger';
import type {
  CollaborationProject,
  CollaborationMember,
  CollaborationComment,
  CollaborationActivity,
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
      const response = await fetch('/api/ar-studio/collaboration/projects');
      if (response.ok) {
        const data = await response.json();
        const transformed: CollaborationProject[] = (data.data || data.projects || []).map(
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
      const response = await fetch('/api/ar-studio/collaboration/members');
      if (response.ok) {
        const data = await response.json();
        const transformed: CollaborationMember[] = (data.data || data.members || []).map(
          (m: any) => ({
            id: m.id,
            userId: m.userId || m.user_id,
            name: m.name || 'Utilisateur',
            email: m.email || '',
            avatar: m.avatar || m.avatarUrl,
            role: (m.role || 'viewer') as any,
            status: (m.status || 'active') as any,
            joinedAt: m.joinedAt ? new Date(m.joinedAt) : new Date(),
            lastActive: m.lastActive ? new Date(m.lastActive) : undefined,
          })
        );
        setMembers(transformed);
      }
    } catch (error) {
      logger.error('Failed to fetch members', { error });
    }
  };

  const fetchComments = async () => {
    try {
      const response = await fetch(
        `/api/ar-studio/collaboration/comments${selectedProject ? `?projectId=${selectedProject}` : ''}`
      );
      if (response.ok) {
        const data = await response.json();
        setComments(data.data || data.comments || []);
      }
    } catch (error) {
      logger.error('Failed to fetch comments', { error });
    }
  };

  const fetchActivities = async () => {
    try {
      const response = await fetch(
        `/api/ar-studio/collaboration/activities${selectedProject ? `?projectId=${selectedProject}` : ''}`
      );
      if (response.ok) {
        const data = await response.json();
        setActivities(data.data || data.activities || []);
      }
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
      const response = await fetch('/api/ar-studio/collaboration/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, role }),
      });

      if (response.ok) {
        await fetchMembers();
        return { success: true };
      }
      return { success: false, error: 'Failed to invite member' };
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


