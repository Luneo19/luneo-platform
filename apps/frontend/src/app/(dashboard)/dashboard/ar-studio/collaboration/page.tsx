'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Users,
  ArrowLeft,
  Plus,
  MessageSquare,
  Share2,
  Settings,
  Crown,
} from 'lucide-react';
import Link from 'next/link';

/**
 * Collaboration AR - AR Studio
 * Travail d'équipe sur les modèles AR
 */
export default function ARStudioCollaborationPage() {
  const [searchTerm, setSearchTerm] = useState('');

  const teamMembers = [
    { id: '1', name: 'Jean Dupont', role: 'Designer 3D', avatar: '', status: 'online' },
    { id: '2', name: 'Marie Martin', role: 'AR Developer', avatar: '', status: 'online' },
    { id: '3', name: 'Pierre Durand', role: 'Product Manager', avatar: '', status: 'away' },
  ];

  const sharedModels = [
    { id: '1', name: 'Lunettes Premium', sharedBy: 'Jean Dupont', sharedAt: 'Il y a 2h', views: 12 },
    { id: '2', name: 'Montre Connectée', sharedBy: 'Marie Martin', sharedAt: 'Il y a 5h', views: 8 },
    { id: '3', name: 'Bague Collection', sharedBy: 'Pierre Durand', sharedAt: 'Hier', views: 15 },
  ];

  return (
    <ErrorBoundary componentName="ARStudioCollaboration">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Link href="/dashboard/ar-studio">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Retour
                </Button>
              </Link>
            </div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
              <Users className="w-8 h-8 text-cyan-400" />
              Collaboration AR
            </h1>
            <p className="text-slate-400 mt-2">
              Travaillez en équipe sur vos modèles AR en temps réel
            </p>
          </div>
          <Button className="bg-cyan-600 hover:bg-cyan-700 text-white">
            <Plus className="w-4 h-4 mr-2" />
            Inviter un membre
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Panel - Team */}
          <div className="lg:col-span-1 space-y-6">
            <Card className="bg-slate-900/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Users className="w-5 h-5 text-cyan-400" />
                  Équipe
                </CardTitle>
                <CardDescription className="text-slate-400">
                  {teamMembers.length} membres actifs
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {teamMembers.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-800/50 transition-colors"
                  >
                    <div className="relative">
                      <Avatar>
                        <AvatarImage src={member.avatar} />
                        <AvatarFallback className="bg-gradient-to-br from-cyan-500 to-blue-500">
                          {member.name.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-slate-900 ${
                        member.status === 'online' ? 'bg-green-500' : 'bg-yellow-500'
                      }`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-white truncate">{member.name}</p>
                        {member.id === '1' && <Crown className="w-3 h-3 text-yellow-500" />}
                      </div>
                      <p className="text-xs text-slate-400 truncate">{member.role}</p>
                    </div>
                    <Button variant="ghost" size="sm">
                      <MessageSquare className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Right Panel - Shared Models */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="bg-slate-900/50 border-slate-700">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-white">Modèles partagés</CardTitle>
                    <CardDescription className="text-slate-400">
                      Modèles collaboratifs de l'équipe
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Rechercher..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-48 bg-slate-800 border-slate-700 text-white"
                    />
                    <Button variant="outline" size="sm" className="border-slate-700 hover:bg-slate-800 text-white">
                      <Settings className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {sharedModels.map((model, index) => (
                    <motion.div
                      key={model.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="flex items-center gap-4 p-4 rounded-lg bg-slate-800/50 hover:bg-slate-800 transition-colors"
                    >
                      <div className="w-16 h-16 bg-gradient-to-br from-cyan-500/20 to-blue-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Share2 className="w-8 h-8 text-cyan-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-white mb-1">{model.name}</h3>
                        <div className="flex items-center gap-4 text-sm text-slate-400">
                          <span>Par {model.sharedBy}</span>
                          <span>•</span>
                          <span>{model.sharedAt}</span>
                          <span>•</span>
                          <span>{model.views} vues</span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="ghost" size="sm">
                          <MessageSquare className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Share2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </ErrorBoundary>
  );
}

