'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Workflow } from 'lucide-react';

const WORKFLOWS = Array.from({ length: 6 }, (_, i) => ({
  id: i + 1,
  name: `Workflow ${i + 1}`,
  description: `Description du workflow automatisé ${i + 1}`,
  status: ['active', 'paused', 'draft'][Math.floor(Math.random() * 3)],
  runs: Math.floor(Math.random() * 1000),
  success: Math.random() * 100,
}));

export function WorkflowTab() {
  return (
    <Card className="bg-gray-50 border-gray-200">
      <CardHeader>
        <CardTitle className="text-gray-900 flex items-center gap-2">
          <Workflow className="w-5 h-5 text-purple-400" />
          Automatisation de Workflow
        </CardTitle>
        <CardDescription className="text-gray-600">
          Automatisez vos processus d&apos;affiliation avec des workflows avancés
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid md:grid-cols-2 gap-4">
          {WORKFLOWS.map((workflow) => (
            <Card key={workflow.id} className="bg-gray-100 border-gray-200">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-gray-900 text-base">{workflow.name}</CardTitle>
                  <Badge
                    className={
                      workflow.status === 'active'
                        ? 'bg-green-500/20 text-green-400'
                        : workflow.status === 'paused'
                          ? 'bg-yellow-500/20 text-yellow-400'
                          : 'bg-slate-500/20 text-slate-400'
                    }
                  >
                    {workflow.status === 'active' ? 'Actif' : workflow.status === 'paused' ? 'En pause' : 'Brouillon'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-4">{workflow.description}</p>
                <div className="space-y-2 mb-4">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-600">Exécutions</span>
                    <span className="text-gray-900 font-medium">{workflow.runs}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-600">Taux de succès</span>
                    <span className="text-gray-900 font-medium">{workflow.success.toFixed(1)}%</span>
                  </div>
                </div>
                <Button size="sm" variant="outline" className="w-full border-purple-500/50 text-purple-400">
                  Configurer
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
