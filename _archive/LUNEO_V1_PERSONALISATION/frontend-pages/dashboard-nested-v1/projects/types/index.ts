/**
 * Types for Projects / Workspaces dashboard
 */

export const PROJECT_TYPE_LABELS: Record<string, string> = {
  DESIGN: 'Design',
  CAMPAIGN: 'Campagne',
  COLLECTION: 'Collection',
  TEMPLATE: 'Template',
  VIRTUAL_TRY_ON: 'Virtual Try-On',
  CUSTOMIZER: 'Customizer',
  CONFIGURATOR: 'Configurator',
  OTHER: 'Autre',
};

export const PROJECT_STATUS_LABELS: Record<string, string> = {
  DRAFT: 'Brouillon',
  ACTIVE: 'Actif',
  ARCHIVED: 'Archivé',
  DELETED: 'Supprimé',
};

export interface ProjectWorkspace {
  id: string;
  name: string;
  environment?: string;
  settings?: Record<string, unknown>;
  createdAt?: string;
  updatedAt?: string;
}

export interface Project {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  type: string;
  status: string;
  apiKey?: string | null;
  thumbnail?: string | null;
  settings?: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
  workspace?: { id: string; name: string } | null;
}

export interface ProjectsFilters {
  search: string;
  type: string;
  status: string;
}

export interface CreateProjectPayload {
  name: string;
  slug: string;
  type: string;
  description?: string;
  settings?: Record<string, unknown>;
  webhookUrl?: string;
}

export interface UpdateProjectPayload {
  name?: string;
  slug?: string;
  type?: string;
  description?: string;
  status?: string;
  settings?: Record<string, unknown>;
  webhookUrl?: string;
}
