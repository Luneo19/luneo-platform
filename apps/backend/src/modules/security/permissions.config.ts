import { OrgRole } from '@prisma/client';

export enum Permission {
  // Agents
  AGENTS_VIEW = 'agents:view',
  AGENTS_CREATE = 'agents:create',
  AGENTS_EDIT = 'agents:edit',
  AGENTS_DELETE = 'agents:delete',
  AGENTS_PUBLISH = 'agents:publish',

  // Conversations
  CONVERSATIONS_VIEW = 'conversations:view',
  CONVERSATIONS_REPLY = 'conversations:reply',
  CONVERSATIONS_ESCALATE = 'conversations:escalate',
  CONVERSATIONS_RESOLVE = 'conversations:resolve',

  // Knowledge Base
  KNOWLEDGE_VIEW = 'knowledge:view',
  KNOWLEDGE_MANAGE = 'knowledge:manage',

  // Analytics
  ANALYTICS_VIEW = 'analytics:view',
  ANALYTICS_EXPORT = 'analytics:export',

  // Team
  TEAM_VIEW = 'team:view',
  TEAM_INVITE = 'team:invite',
  TEAM_MANAGE_ROLES = 'team:manage_roles',
  TEAM_REMOVE = 'team:remove',

  // Billing
  BILLING_VIEW = 'billing:view',
  BILLING_MANAGE = 'billing:manage',

  // Settings
  SETTINGS_VIEW = 'settings:view',
  SETTINGS_MANAGE = 'settings:manage',

  // Integrations
  INTEGRATIONS_VIEW = 'integrations:view',
  INTEGRATIONS_MANAGE = 'integrations:manage',
}

const ALL_PERMISSIONS = Object.values(Permission);

const VIEW_PERMISSIONS: Permission[] = [
  Permission.AGENTS_VIEW,
  Permission.CONVERSATIONS_VIEW,
  Permission.KNOWLEDGE_VIEW,
  Permission.ANALYTICS_VIEW,
  Permission.TEAM_VIEW,
  Permission.BILLING_VIEW,
  Permission.SETTINGS_VIEW,
  Permission.INTEGRATIONS_VIEW,
];

export const ROLE_PERMISSIONS: Record<OrgRole, Permission[]> = {
  [OrgRole.OWNER]: ALL_PERMISSIONS,

  [OrgRole.ADMIN]: ALL_PERMISSIONS.filter(
    (p) =>
      p !== Permission.BILLING_MANAGE &&
      p !== Permission.TEAM_MANAGE_ROLES &&
      p !== Permission.TEAM_REMOVE,
  ),

  [OrgRole.MEMBER]: [
    // Agents: view, create, edit
    Permission.AGENTS_VIEW,
    Permission.AGENTS_CREATE,
    Permission.AGENTS_EDIT,

    // Conversations: view, reply, escalate
    Permission.CONVERSATIONS_VIEW,
    Permission.CONVERSATIONS_REPLY,
    Permission.CONVERSATIONS_ESCALATE,

    // Knowledge: view + manage
    Permission.KNOWLEDGE_VIEW,
    Permission.KNOWLEDGE_MANAGE,

    // Analytics: view only
    Permission.ANALYTICS_VIEW,

    // Team: view only
    Permission.TEAM_VIEW,

    // Settings: view only
    Permission.SETTINGS_VIEW,

    // Integrations: view only
    Permission.INTEGRATIONS_VIEW,
  ],

  [OrgRole.VIEWER]: VIEW_PERMISSIONS,
};

export function hasPermission(role: OrgRole, permission: Permission): boolean {
  const permissions = ROLE_PERMISSIONS[role];
  return permissions?.includes(permission) ?? false;
}

export function getPermissionsForRole(role: OrgRole): Permission[] {
  return ROLE_PERMISSIONS[role] ?? [];
}
