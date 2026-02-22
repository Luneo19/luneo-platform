'use client';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { User, Users as UsersIcon } from 'lucide-react';

const MEMBERS = Array.from({ length: 5 }, (_, i) => ({
  id: i + 1,
  name: `Membre ${i + 1}`,
  role: ['Manager', 'Affiliate', 'Analyst', 'Support', 'Admin'][i],
  status: 'online',
}));
const PERMISSIONS = ['Voir les statistiques', 'Gérer les liens', 'Voir les commissions', 'Exporter les données', 'Gérer les paramètres'];

export function CollaborationTab() {
  return (
    <Card className="bg-gray-50 border-gray-200">
      <CardHeader>
        <CardTitle className="text-gray-900 flex items-center gap-2">
          <UsersIcon className="w-5 h-5 text-purple-400" />
          Collaboration & Équipe
        </CardTitle>
        <CardDescription className="text-gray-600">
          Gestion avancée de la collaboration et des équipes d&apos;affiliation
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid md:grid-cols-2 gap-6">
          <Card className="bg-gray-100 border-gray-200">
            <CardHeader>
              <CardTitle className="text-gray-900 text-lg">Membres de l&apos;équipe</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {MEMBERS.map((member) => (
                  <div key={member.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center">
                        <User className="w-5 h-5 text-purple-400" />
                      </div>
                      <div>
                        <p className="text-gray-900 font-medium">{member.name}</p>
                        <p className="text-xs text-gray-600">{member.role}</p>
                      </div>
                    </div>
                    <Badge className="bg-green-500/20 text-green-400">En ligne</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gray-100 border-gray-200">
            <CardHeader>
              <CardTitle className="text-gray-900 text-lg">Permissions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {PERMISSIONS.map((permission, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-gray-900 text-sm">{permission}</span>
                    <Checkbox defaultChecked />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </CardContent>
    </Card>
  );
}
