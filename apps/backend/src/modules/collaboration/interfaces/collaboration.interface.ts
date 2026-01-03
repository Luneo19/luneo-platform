/**
 * ★★★ INTERFACES - COLLABORATION ★★★
 * Interfaces TypeScript pour la collaboration
 * Respecte les patterns existants du projet
 */

// ========================================
// RESSOURCES PARTAGÉES
// ========================================

export enum ResourceType {
  ANALYTICS_REPORT = 'ANALYTICS_REPORT',
  AI_GENERATION = 'AI_GENERATION',
  DESIGN = 'DESIGN',
  PRODUCT = 'PRODUCT',
  ORDER = 'ORDER',
  CUSTOMIZATION = 'CUSTOMIZATION',
}

export type Permission = 'view' | 'edit' | 'delete' | 'comment';

export interface SharedResource {
  id: string;
  resourceType: ResourceType;
  resourceId: string;
  sharedWith: string[]; // User IDs
  permissions: Record<string, Permission[]>; // { userId: ['view', 'edit'] }
  isPublic: boolean;
  publicToken?: string;
  createdBy: string;
  brandId: string;
  createdAt: Date;
  updatedAt: Date;
}

// ========================================
// COMMENTAIRES
// ========================================

export interface Comment {
  id: string;
  resourceType: ResourceType;
  resourceId: string;
  content: string;
  parentId?: string;
  authorId: string;
  author: {
    id: string;
    name: string;
    email: string;
    avatar?: string;
  };
  sharedResourceId?: string;
  createdAt: Date;
  updatedAt: Date;
  replies?: Comment[];
}

// ========================================
// ANNOTATIONS
// ========================================

export interface Annotation {
  id: string;
  resourceType: ResourceType;
  resourceId: string;
  type: 'comment' | 'suggestion' | 'issue';
  position?: {
    x: number;
    y: number;
    width?: number;
    height?: number;
  };
  content: string;
  authorId: string;
  createdAt: Date;
}






