/**
 * Client Component pour AR Studio Collaboration
 * Version professionnelle simplifiée
 */

'use client';

import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { CollaborationHeader } from './components/CollaborationHeader';
import { CollaborationStats } from './components/CollaborationStats';
import { useCollaboration } from './hooks/useCollaboration';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
  Folder,
  Users,
  MessageSquare,
  Activity,
  Plus,
  Mail,
  Crown,
  Shield,
  Edit,
  Eye,
} from 'lucide-react';
import { formatDate } from '@/lib/utils/formatters';
import { cn } from '@/lib/utils';
import type { CollaborationRole } from './types';

export function ARCollaborationPageClient() {
  const { toast } = useToast();
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<CollaborationRole>('viewer');

  const {
    projects,
    members,
    comments,
    activities,
    stats,
    isLoading,
    inviteMember,
  } = useCollaboration();

  const handleInvite = async () => {
    if (!inviteEmail.trim()) {
      toast({
        title: 'Erreur',
        description: 'Veuillez entrer une adresse email',
        variant: 'destructive',
      });
      return;
    }

    const result = await inviteMember(inviteEmail, inviteRole);
    if (result.success) {
      toast({
        title: 'Succès',
        description: 'Invitation envoyée',
      });
      setShowInviteDialog(false);
      setInviteEmail('');
    } else {
      toast({
        title: 'Erreur',
        description: result.error || 'Erreur lors de l\'invitation',
        variant: 'destructive',
      });
    }
  };

  const getRoleIcon = (role: CollaborationRole) => {
    switch (role) {
      case 'owner':
        return Crown;
      case 'admin':
        return Shield;
      case 'editor':
        return Edit;
      default:
        return Eye;
    }
  };

  const getRoleColor = (role: CollaborationRole) => {
    switch (role) {
      case 'owner':
        return 'bg-yellow-500';
      case 'admin':
        return 'bg-purple-500';
      case 'editor':
        return 'bg-blue-500';
      default:
        return 'bg-gray-500';
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6 pb-10">
        <div className="h-16 bg-gray-800 rounded animate-pulse" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-24 bg-gray-800 rounded animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-10">
      <CollaborationHeader
        onInviteMember={() => setShowInviteDialog(true)}
        onCreateProject={() => toast({ title: 'Fonctionnalité à venir' })}
      />
      <CollaborationStats {...stats} />

      <Tabs defaultValue="projects" className="space-y-4">
        <TabsList className="bg-gray-800 border-gray-700">
          <TabsTrigger value="projects" className="data-[state=active]:bg-gray-700">
            <Folder className="w-4 h-4 mr-2" />
            Projets
          </TabsTrigger>
          <TabsTrigger value="members" className="data-[state=active]:bg-gray-700">
            <Users className="w-4 h-4 mr-2" />
            Membres
          </TabsTrigger>
          <TabsTrigger value="comments" className="data-[state=active]:bg-gray-700">
            <MessageSquare className="w-4 h-4 mr-2" />
            Commentaires
          </TabsTrigger>
          <TabsTrigger value="activity" className="data-[state=active]:bg-gray-700">
            <Activity className="w-4 h-4 mr-2" />
            Activité
          </TabsTrigger>
        </TabsList>

        <TabsContent value="projects" className="space-y-4">
          <Card className="bg-gray-800/50 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">Projets collaboratifs</CardTitle>
              <CardDescription>{projects.length} projets au total</CardDescription>
            </CardHeader>
            <CardContent>
              {projects.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {projects.map((project) => (
                    <Card
                      key={project.id}
                      className="bg-gray-900/50 border-gray-700 hover:border-cyan-500/50 transition-colors"
                    >
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div>
                            <CardTitle className="text-white text-lg">{project.name}</CardTitle>
                            <CardDescription className="text-gray-400 text-xs mt-1">
                              {project.description}
                            </CardDescription>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-400">Membres</span>
                          <span className="text-white">{project.members.length}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-400">Modèles</span>
                          <span className="text-white">{project.modelCount}</span>
                        </div>
                        <div className="flex items-center gap-2 pt-2 border-t border-gray-700">
                          {project.members.slice(0, 3).map((member) => (
                            <Avatar key={member.id} className="w-6 h-6">
                              <AvatarImage src={member.avatar} />
                              <AvatarFallback className="text-xs">
                                {member.name.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                          ))}
                          {project.members.length > 3 && (
                            <span className="text-xs text-gray-400">
                              +{project.members.length - 3}
                            </span>
                          )}
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full border-gray-600"
                          onClick={() => toast({ title: 'Ouverture du projet' })}
                        >
                          Ouvrir
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Folder className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-400 mb-4">Aucun projet collaboratif</p>
                  <Button className="bg-cyan-600 hover:bg-cyan-700">
                    <Plus className="w-4 h-4 mr-2" />
                    Créer un projet
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="members" className="space-y-4">
          <Card className="bg-gray-800/50 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">Membres de l'équipe</CardTitle>
              <CardDescription>{members.length} membres</CardDescription>
            </CardHeader>
            <CardContent>
              {members.length > 0 ? (
                <div className="space-y-3">
                  {members.map((member) => {
                    const RoleIcon = getRoleIcon(member.role);
                    return (
                      <div
                        key={member.id}
                        className="flex items-center justify-between p-4 bg-gray-900/50 rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <Avatar>
                            <AvatarImage src={member.avatar} />
                            <AvatarFallback>{member.name.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="text-white font-medium">{member.name}</p>
                            <p className="text-gray-400 text-sm">{member.email}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <Badge className={cn('flex items-center gap-1', getRoleColor(member.role))}>
                            <RoleIcon className="w-3 h-3" />
                            {member.role}
                          </Badge>
                          {member.status === 'active' && (
                            <Badge className="bg-green-500">Actif</Badge>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-gray-400 text-center py-12">Aucun membre</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="comments" className="space-y-4">
          <Card className="bg-gray-800/50 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">Commentaires</CardTitle>
              <CardDescription>{comments.length} commentaires</CardDescription>
            </CardHeader>
            <CardContent>
              {comments.length > 0 ? (
                <div className="space-y-4">
                  {comments.slice(0, 10).map((comment) => (
                    <div key={comment.id} className="p-4 bg-gray-900/50 rounded-lg">
                      <div className="flex items-start gap-3">
                        <Avatar>
                          <AvatarImage src={comment.userAvatar} />
                          <AvatarFallback>{comment.userName.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="text-white font-medium text-sm">{comment.userName}</p>
                            <span className="text-gray-500 text-xs">
                              {formatDate(comment.createdAt)}
                            </span>
                          </div>
                          <p className="text-gray-300 text-sm">{comment.content}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-400 text-center py-12">Aucun commentaire</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activity" className="space-y-4">
          <Card className="bg-gray-800/50 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">Activité récente</CardTitle>
              <CardDescription>Historique des actions</CardDescription>
            </CardHeader>
            <CardContent>
              {activities.length > 0 ? (
                <div className="space-y-3">
                  {activities.slice(0, 20).map((activity) => (
                    <div
                      key={activity.id}
                      className="flex items-center gap-3 p-3 bg-gray-900/50 rounded-lg"
                    >
                      <Avatar className="w-8 h-8">
                        <AvatarImage src={activity.userAvatar} />
                        <AvatarFallback>{activity.userName.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <p className="text-white text-sm">
                          <span className="font-medium">{activity.userName}</span>{' '}
                          {activity.action}
                          {activity.target && (
                            <>
                              {' '}
                              <span className="text-gray-400">{activity.target}</span>
                            </>
                          )}
                        </p>
                        <p className="text-gray-500 text-xs mt-1">
                          {formatDate(activity.createdAt)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-400 text-center py-12">Aucune activité</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={showInviteDialog} onOpenChange={setShowInviteDialog}>
        <DialogContent className="bg-gray-800 border-gray-700 text-white">
          <DialogHeader>
            <DialogTitle>Inviter un membre</DialogTitle>
            <DialogDescription className="text-gray-400">
              Invitez quelqu'un à collaborer sur vos projets AR
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <Label className="text-gray-300">Email</Label>
              <Input
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="email@example.com"
                className="bg-gray-900 border-gray-600 text-white mt-2"
              />
            </div>
            <div>
              <Label className="text-gray-300">Rôle</Label>
              <Select value={inviteRole} onValueChange={(v) => setInviteRole(v as CollaborationRole)}>
                <SelectTrigger className="bg-gray-900 border-gray-600 text-white mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="viewer">
                    <div className="flex items-center gap-2">
                      <Eye className="w-4 h-4" />
                      Viewer (Lecture seule)
                    </div>
                  </SelectItem>
                  <SelectItem value="editor">
                    <div className="flex items-center gap-2">
                      <Edit className="w-4 h-4" />
                      Editor (Édition)
                    </div>
                  </SelectItem>
                  <SelectItem value="admin">
                    <div className="flex items-center gap-2">
                      <Shield className="w-4 h-4" />
                      Admin (Gestion)
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex items-center justify-end gap-3 mt-6">
            <Button variant="outline" onClick={() => setShowInviteDialog(false)} className="border-gray-600">
              Annuler
            </Button>
            <Button onClick={handleInvite} className="bg-cyan-600 hover:bg-cyan-700">
              <Mail className="w-4 h-4 mr-2" />
              Envoyer l'invitation
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}



