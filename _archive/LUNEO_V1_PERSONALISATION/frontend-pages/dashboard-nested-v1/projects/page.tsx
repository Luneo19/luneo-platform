/**
 * Projects / Workspaces dashboard page
 * Server Component - uses Client for list and actions
 */

import { Suspense } from 'react';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { ProjectsPageClient } from './ProjectsPageClient';
import { ProjectsSkeleton } from './components/ProjectsSkeleton';

export const metadata = {
  title: 'Projets | Luneo',
  description: 'Gérez vos projets et workspaces',
};

export default function ProjectsPage() {
  return (
    <ErrorBoundary level="page" componentName="ProjectsPage">
      <Suspense fallback={<ProjectsSkeleton />}>
        <ProjectsPageClient />
      </Suspense>
    </ErrorBoundary>
  );
}
