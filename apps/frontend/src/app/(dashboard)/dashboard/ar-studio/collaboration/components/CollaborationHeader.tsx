/**
 * Header de la page AR Studio Collaboration
 */

'use client';

import { useI18n } from '@/i18n/useI18n';
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
  const { t } = useI18n();
  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-white flex items-center gap-3">
          <Users className="w-8 h-8 text-cyan-400" />
          {t('arStudio.collaborationTitle')}
        </h1>
        <p className="text-gray-400 mt-1">
          {t('arStudio.collaborationDesc')}
        </p>
      </div>
      <div className="flex gap-3">
        <Button onClick={onInviteMember} variant="outline" className="border-gray-600">
          <Users className="w-4 h-4 mr-2" />
          {t('arStudio.invite')}
        </Button>
        <Button onClick={onCreateProject} className="bg-cyan-600 hover:bg-cyan-700">
          <Plus className="w-4 h-4 mr-2" />
          {t('arStudio.newProject')}
        </Button>
      </div>
    </div>
  );
}



