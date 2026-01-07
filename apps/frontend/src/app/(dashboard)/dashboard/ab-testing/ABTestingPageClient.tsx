/**
 * Client Component pour AB Testing
 * Version professionnelle simplifiée
 */

'use client';

import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { ABTestingHeader } from './components/ABTestingHeader';
import { ABTestingStats } from './components/ABTestingStats';
import { ExperimentsList } from './components/ExperimentsList';
import { useABTesting } from './hooks/useABTesting';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Filter } from 'lucide-react';
import type { ExperimentStatus } from './types';

export function ABTestingPageClient() {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [selectedExperiment, setSelectedExperiment] = useState<any>(null);

  const { experiments, stats, isLoading, toggleExperiment } = useABTesting(
    searchTerm,
    filterStatus
  );

  const handleView = (experiment: any) => {
    setSelectedExperiment(experiment);
    toast({
      title: 'Détails',
      description: `Ouverture des détails de "${experiment.name}"`,
    });
  };

  const handleToggle = async (id: string, status: 'running' | 'paused') => {
    const result = await toggleExperiment(id, status);
    if (result.success) {
      toast({
        title: 'Succès',
        description: `Test ${status === 'running' ? 'repris' : 'mis en pause'}`,
      });
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6 pb-10">
        <div className="h-16 bg-gray-800 rounded animate-pulse" />
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div key={i} className="h-24 bg-gray-800 rounded animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-10">
      <ABTestingHeader onCreateExperiment={() => toast({ title: 'Fonctionnalité à venir' })} />
      <ABTestingStats {...stats} />

      <Card className="p-4 bg-gray-800/50 border-gray-700">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Rechercher un test..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-gray-900 border-gray-600 text-white pl-10"
              />
            </div>
          </div>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-48 bg-gray-900 border-gray-600 text-white">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Statut" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les statuts</SelectItem>
              <SelectItem value="running">En cours</SelectItem>
              <SelectItem value="paused">En pause</SelectItem>
              <SelectItem value="completed">Terminés</SelectItem>
              <SelectItem value="draft">Brouillons</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="mt-3 text-sm text-gray-400">
          {experiments.length} test{experiments.length > 1 ? 's' : ''} trouvé{experiments.length > 1 ? 's' : ''}
        </div>
      </Card>

      <ExperimentsList
        experiments={experiments}
        onView={handleView}
        onToggle={handleToggle}
      />
    </div>
  );
}


