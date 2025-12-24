'use client';

/**
 * Collaborator Avatars Component
 * C-003: Présence utilisateurs en temps réel
 */

import { memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users } from 'lucide-react';
import OptimizedImage from '../optimized/OptimizedImage';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface Collaborator {
  id: string;
  connectionId: number;
  name: string;
  avatar?: string;
  color: string;
  isActive: boolean;
}

interface CollaboratorAvatarsProps {
  collaborators: Collaborator[];
  maxVisible?: number;
  size?: 'sm' | 'md' | 'lg';
}

const sizeClasses = {
  sm: 'w-6 h-6 text-xs',
  md: 'w-8 h-8 text-sm',
  lg: 'w-10 h-10 text-base',
};

const Avatar = memo(function Avatar({
  collaborator,
  size,
  style,
}: {
  collaborator: Collaborator;
  size: 'sm' | 'md' | 'lg';
  style?: React.CSSProperties;
}) {
  const sizeClass = sizeClasses[size];
  const initials = collaborator.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            className={`${sizeClass} rounded-full ring-2 ring-slate-900 flex items-center justify-center font-medium`}
            style={{
              backgroundColor: collaborator.color,
              ...style,
            }}
          >
            {collaborator.avatar ? (
              <OptimizedImage src={collaborator.avatar} alt={collaborator.name} fill className="w-full h-full rounded-full object-cover" />
            ) : (
              <span className="text-white">{initials}</span>
            )}
            {collaborator.isActive && (
              <span className="absolute bottom-0 right-0 w-2 h-2 bg-green-500 rounded-full ring-2 ring-slate-900" />
            )}
          </motion.div>
        </TooltipTrigger>
        <TooltipContent>
          <p>{collaborator.name}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
});

export function CollaboratorAvatars({
  collaborators,
  maxVisible = 4,
  size = 'md',
}: CollaboratorAvatarsProps) {
  const visibleCollaborators = collaborators.slice(0, maxVisible);
  const hiddenCount = Math.max(0, collaborators.length - maxVisible);
  const sizeClass = sizeClasses[size];

  if (collaborators.length === 0) {
    return (
      <div className="flex items-center gap-2 text-slate-500 text-sm">
        <Users className="w-4 h-4" />
        <span>Personne d'autre</span>
      </div>
    );
  }

  return (
    <div className="flex items-center">
      <div className="flex -space-x-2">
        <AnimatePresence>
          {visibleCollaborators.map((collaborator, index) => (
            <Avatar
              key={collaborator.connectionId}
              collaborator={collaborator}
              size={size}
              style={{ zIndex: visibleCollaborators.length - index }}
            />
          ))}
        </AnimatePresence>

        {hiddenCount > 0 && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div
                  className={`${sizeClass} rounded-full ring-2 ring-slate-900 flex items-center justify-center bg-slate-700 text-white font-medium`}
                >
                  +{hiddenCount}
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <div className="space-y-1">
                  {collaborators.slice(maxVisible).map((c) => (
                    <p key={c.connectionId}>{c.name}</p>
                  ))}
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>

      <span className="ml-3 text-sm text-slate-400">
        {collaborators.length} collaborateur{collaborators.length > 1 ? 's' : ''}
      </span>
    </div>
  );
}

const CollaboratorAvatarsMemo = memo(CollaboratorAvatars);

export default function CollaboratorAvatarsWithErrorBoundary(props: CollaboratorAvatarsProps) {
  return (
    <ErrorBoundary componentName="CollaboratorAvatars">
      <CollaboratorAvatarsMemo {...props} />
    </ErrorBoundary>
  );
}

