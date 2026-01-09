/**
 * Header de la page AR Studio Collaboration
 */

'use client';

import { Users, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface CollaborationHeaderProps {
  onInviteMember: () => void;
  onCreateProject: () => void;
}

export function CollaborationHeader({
  onInviteMember,
  onCreateProject,
}: CollaborationHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-white flex items-center gap-3">
          <Users className="w-8 h-8 text-cyan-400" />
          Collaboration AR
        </h1>
        <p className="text-gray-400 mt-1">
          Travaillez en équipe sur vos modèles AR
        </p>
      </div>
      <div className="flex gap-3">
        <Button onClick={onInviteMember} variant="outline" className="border-gray-600">
          <Users className="w-4 h-4 mr-2" />
          Inviter
        </Button>
        <Button onClick={onCreateProject} className="bg-cyan-600 hover:bg-cyan-700">
          <Plus className="w-4 h-4 mr-2" />
          Nouveau projet
        </Button>
      </div>
    </div>
  );
}



