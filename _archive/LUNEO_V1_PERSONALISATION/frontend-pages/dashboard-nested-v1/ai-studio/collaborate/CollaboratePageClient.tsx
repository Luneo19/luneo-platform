'use client';

import { useState } from 'react';
import { Users, Plus, LogOut, ImageIcon } from 'lucide-react';
import Image from 'next/image';

interface Workspace {
  id: string;
  name: string;
  memberCount: number;
  collaboratorAvatars: string[];
  isActive?: boolean;
}

interface SharedGeneration {
  id: string;
  thumbnailUrl: string | null;
  prompt: string;
  createdAt: string;
  authorName: string;
}

const MOCK_WORKSPACES: Workspace[] = [];
const MOCK_GENERATIONS: SharedGeneration[] = [];

export function CollaboratePageClient() {
  const [workspaces, setWorkspaces] = useState<Workspace[]>(MOCK_WORKSPACES);
  const [activeWorkspace, setActiveWorkspace] = useState<Workspace | null>(null);
  const [sharedGenerations, setSharedGenerations] = useState<SharedGeneration[]>(MOCK_GENERATIONS);
  const [newWorkspaceName, setNewWorkspaceName] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const handleCreateWorkspace = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWorkspaceName.trim()) return;
    setIsCreating(true);
    try {
      // TODO: Call API to create workspace
      setNewWorkspaceName('');
    } finally {
      setIsCreating(false);
    }
  };

  const handleJoin = async (workspaceId: string) => {
    // TODO: Call API to join workspace
  };

  const handleLeave = async (workspaceId: string) => {
    // TODO: Call API to leave workspace
    if (activeWorkspace?.id === workspaceId) setActiveWorkspace(null);
  };

  return (
    <div className="space-y-6 pb-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Collaboration</h1>
          <p className="text-white/60 mt-1">Espaces de travail partagés et générations en équipe</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Create workspace + list */}
        <div className="lg:col-span-1 space-y-6">
          <div className="dash-card rounded-2xl p-6 border border-white/[0.06] bg-white/[0.03]">
            <h2 className="text-lg font-semibold text-white mb-4">Nouvel espace</h2>
            <form onSubmit={handleCreateWorkspace} className="flex gap-2">
              <input
                type="text"
                value={newWorkspaceName}
                onChange={(e) => setNewWorkspaceName(e.target.value)}
                placeholder="Nom de l'espace"
                className="flex-1 bg-white/[0.05] border border-white/[0.1] rounded-xl px-4 py-3 text-white placeholder:text-white/30 focus:border-indigo-500/50 focus:outline-none"
              />
              <button
                type="submit"
                disabled={!newWorkspaceName.trim() || isCreating}
                className="px-4 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                <Plus className="w-5 h-5" />
                Créer
              </button>
            </form>
          </div>

          <div className="dash-card rounded-2xl p-6 border border-white/[0.06] bg-white/[0.03]">
            <h2 className="text-lg font-semibold text-white mb-4">Mes espaces</h2>
            {workspaces.length === 0 ? (
              <p className="text-white/40 text-sm py-4">Aucun espace. Créez-en un ou rejoignez-en un.</p>
            ) : (
              <div className="space-y-2">
                {workspaces.map((ws) => (
                  <div
                    key={ws.id}
                    className={`flex items-center justify-between rounded-xl px-4 py-3 transition-colors ${
                      activeWorkspace?.id === ws.id ? 'bg-indigo-500/10 border border-indigo-500/30' : 'bg-white/[0.03] border border-white/[0.06]'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => setActiveWorkspace(ws)}
                      className="flex items-center gap-3 flex-1 text-left min-w-0"
                    >
                      <div className="flex -space-x-2">
                        {ws.collaboratorAvatars.slice(0, 3).map((avatar, i) => (
                          <div
                            key={i}
                            className="w-8 h-8 rounded-full bg-indigo-500/30 border-2 border-white/[0.06] flex items-center justify-center text-xs font-medium text-white"
                          >
                            {avatar ? <Image src={avatar} alt="" className="w-full h-full rounded-full object-cover" width={200} height={200} unoptimized /> : '?'}
                          </div>
                        ))}
                      </div>
                      <div className="min-w-0">
                        <p className="text-white font-medium truncate">{ws.name}</p>
                        <p className="text-xs text-white/50">{ws.memberCount} membre{ws.memberCount > 1 ? 's' : ''}</p>
                      </div>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleLeave(ws.id)}
                      className="p-2 text-white/50 hover:text-red-400 rounded-lg hover:bg-red-500/10 transition-colors"
                      title="Quitter"
                    >
                      <LogOut className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Active workspace view */}
        <div className="lg:col-span-2 dash-card rounded-2xl p-6 border border-white/[0.06] bg-white/[0.03]">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Users className="w-5 h-5 text-indigo-400" />
            {activeWorkspace ? activeWorkspace.name : 'Sélectionnez un espace'}
          </h2>

          {!activeWorkspace ? (
            <p className="text-white/40 text-center py-12">Sélectionnez un espace à gauche pour voir les générations partagées.</p>
          ) : (
            <>
              <div className="flex items-center gap-2 mb-4">
                {activeWorkspace.collaboratorAvatars.map((avatar, i) => (
                  <div
                    key={i}
                    className="w-8 h-8 rounded-full bg-white/[0.08] border border-white/[0.1] flex items-center justify-center text-xs text-white/70"
                  >
                    {avatar ? <Image src={avatar} alt="" className="w-full h-full rounded-full object-cover" width={200} height={200} unoptimized /> : '?'}
                  </div>
                ))}
                <span className="text-sm text-white/50">{activeWorkspace.memberCount} collaborateur(s)</span>
              </div>

              <div className="border-t border-white/[0.06] pt-4">
                <p className="text-sm text-white/60 mb-3">Générations partagées</p>
                {sharedGenerations.length === 0 ? (
                  <p className="text-white/40 text-center py-8">Aucune génération partagée dans cet espace.</p>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    {sharedGenerations.map((gen) => (
                      <div key={gen.id} className="bg-white/[0.03] rounded-xl overflow-hidden border border-white/[0.06]">
                        <div className="aspect-square bg-white/[0.05] flex items-center justify-center">
                          {gen.thumbnailUrl ? (
                            <Image src={gen.thumbnailUrl} alt="" className="w-full h-full object-cover" width={200} height={200} unoptimized />
                          ) : (
                            <ImageIcon className="w-12 h-12 text-white/20" />
                          )}
                        </div>
                        <div className="p-2">
                          <p className="text-xs text-white/70 truncate" title={gen.prompt}>{gen.prompt}</p>
                          <p className="text-xs text-white/40">{gen.authorName}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
