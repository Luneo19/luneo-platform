/**
 * Constants pour la page Team
 */

import { Crown, Shield, Users, Eye } from 'lucide-react';
import type { TeamRole } from '../types';

export interface RoleInfo {
  id: TeamRole;
  name: string;
  description: string;
  color: string;
  icon: React.ElementType;
}

export const ROLES: RoleInfo[] = [
  {
    id: 'OWNER',
    name: 'Propriétaire',
    description: 'Accès complet à toutes les fonctionnalités',
    color: 'yellow',
    icon: Crown,
  },
  {
    id: 'ADMIN',
    name: 'Administrateur',
    description: 'Gestion complète sauf facturation et suppression',
    color: 'blue',
    icon: Shield,
  },
  {
    id: 'MEMBER',
    name: 'Membre',
    description: 'Création et modification de contenu',
    color: 'green',
    icon: Users,
  },
  {
    id: 'VIEWER',
    name: 'Observateur',
    description: 'Lecture seule sur tous les contenus',
    color: 'gray',
    icon: Eye,
  },
];

export const ROLE_OPTIONS = ROLES.filter((r) => r.id !== 'OWNER');



