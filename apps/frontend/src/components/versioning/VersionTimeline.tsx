'use client';

import { ErrorBoundary } from '@/components/ErrorBoundary';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { motion } from 'framer-motion';
import {
    CheckCircle,
    Clock,
    Download,
    Eye,
    GitBranch,
    RotateCcw,
    Save,
    Sparkles,
    Trash2
} from 'lucide-react';
import Image from 'next/image';
import { memo } from 'react';
// Format date helper (sans date-fns pour éviter dépendance)
function formatDistanceToNow(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSecs < 60) return 'il y a quelques secondes';
  if (diffMins < 60) return `il y a ${diffMins} minute${diffMins > 1 ? 's' : ''}`;
  if (diffHours < 24) return `il y a ${diffHours} heure${diffHours > 1 ? 's' : ''}`;
  if (diffDays < 7) return `il y a ${diffDays} jour${diffDays > 1 ? 's' : ''}`;
  
  const diffWeeks = Math.floor(diffDays / 7);
  if (diffWeeks < 4) return `il y a ${diffWeeks} semaine${diffWeeks > 1 ? 's' : ''}`;
  
  const diffMonths = Math.floor(diffDays / 30);
  return `il y a ${diffMonths} mois`;
}

interface DesignVersion {
  id: string;
  version_number: number;
  is_auto_save: boolean;
  preview_url?: string;
  created_at: string;
  metadata?: {
    auto_save?: boolean;
    notes?: string;
    restored_from?: string;
  };
}

interface VersionTimelineProps {
  designId: string;
  versions: DesignVersion[];
  currentVersionId?: string;
  onRestore?: (versionId: string) => Promise<void>;
  onDelete?: (versionId: string) => Promise<void>;
  onView?: (versionId: string) => void;
  loading?: boolean;
}

function VersionTimelineContent({
  designId,
  versions,
  currentVersionId,
  onRestore,
  onDelete,
  onView,
  loading = false,
}: VersionTimelineProps) {
  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="p-4 bg-gray-800/50 border-gray-700 animate-pulse">
            <div className="h-20 bg-gray-700 rounded" />
          </Card>
        ))}
      </div>
    );
  }

  if (versions.length === 0) {
    return (
      <Card className="p-12 bg-gray-800/30 border-gray-700 border-dashed text-center">
        <Clock className="w-16 h-16 text-gray-600 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-400 mb-2">Aucune version</h3>
        <p className="text-sm text-gray-500">
          Les versions seront créées automatiquement lors des modifications
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {versions.map((version, index) => {
        const isCurrent = version.id === currentVersionId;
        const isAutoSave = version.is_auto_save || version.metadata?.auto_save;
        const isFirst = index === 0;
        const isLast = index === versions.length - 1;

        return (
          <motion.div
            key={version.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: index * 0.05 }}
          >
            <Card
              className={`p-4 bg-gray-800/50 border-gray-700 hover:border-blue-500/50 transition-all ${
                isCurrent ? 'border-blue-500/50 bg-blue-900/10' : ''
              }`}
            >
              <div className="flex gap-4">
                {/* Timeline Line */}
                <div className="flex flex-col items-center">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      isCurrent
                        ? 'bg-blue-500 text-white'
                        : isAutoSave
                        ? 'bg-gray-600 text-gray-300'
                        : 'bg-purple-500 text-white'
                    }`}
                  >
                    {isCurrent ? (
                      <CheckCircle className="w-5 h-5" />
                    ) : isAutoSave ? (
                      <Save className="w-5 h-5" />
                    ) : (
                      <GitBranch className="w-5 h-5" />
                    )}
                  </div>
                  {!isLast && (
                    <div className="w-0.5 h-full min-h-[60px] bg-gray-700 mt-2" />
                  )}
                </div>

                {/* Version Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold text-white">
                          Version {version.version_number}
                          {isCurrent && (
                            <span className="ml-2 text-xs text-blue-400">(Actuelle)</span>
                          )}
                        </h4>
                        {isAutoSave ? (
                          <span className="px-2 py-0.5 bg-gray-700 text-gray-300 text-xs rounded flex items-center gap-1">
                            <Sparkles className="w-3 h-3" />
                            Auto-sauvegarde
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 bg-purple-500/20 text-purple-400 text-xs rounded flex items-center gap-1">
                            <GitBranch className="w-3 h-3" />
                            Manuelle
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-400 flex items-center gap-2">
                        <Clock className="w-3 h-3" />
                        {formatDistanceToNow(new Date(version.created_at))}
                      </p>
                      {version.metadata?.notes && (
                        <p className="text-sm text-gray-500 mt-2 italic">
                          "{version.metadata.notes}"
                        </p>
                      )}
                    </div>

                    {/* Preview */}
                    {version.preview_url && (
                      <div className="ml-4 flex-shrink-0">
                        <div className="relative w-20 h-20 rounded-lg overflow-hidden bg-gray-900 border border-gray-700">
                          <Image
                            src={version.preview_url}
                            alt={`Version ${version.version_number}`}
                            fill
                            className="object-cover"
                            sizes="80px"
                            loading="lazy"
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-700">
                    {onView && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onView(version.id)}
                        className="border-gray-700 text-gray-300 hover:text-white"
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        Voir
                      </Button>
                    )}
                    {onRestore && !isCurrent && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onRestore(version.id)}
                        className="border-gray-700 text-gray-300 hover:text-blue-400"
                      >
                        <RotateCcw className="w-4 h-4 mr-1" />
                        Restaurer
                      </Button>
                    )}
                    {onDelete && !isCurrent && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => onDelete(version.id)}
                        className="text-red-400 hover:text-red-300"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                    {version.preview_url && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          window.open(version.preview_url, '_blank');
                        }}
                        className="text-gray-400 hover:text-gray-300"
                      >
                        <Download className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>
        );
      })}
    </div>
  );
}

const VersionTimelineMemo = memo(VersionTimelineContent);

// Named export for direct imports
export const VersionTimeline = VersionTimelineMemo;

// Default export with error boundary
export default function VersionTimelineWithErrorBoundary(props: VersionTimelineProps) {
  return (
    <ErrorBoundary componentName="VersionTimeline">
      <VersionTimelineMemo {...props} />
    </ErrorBoundary>
  );
}

