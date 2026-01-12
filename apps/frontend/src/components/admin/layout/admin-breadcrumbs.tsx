/**
 * ★★★ ADMIN BREADCRUMBS ★★★
 * Breadcrumbs dynamiques pour la navigation dans le Super Admin Dashboard
 */

'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { ChevronRight, Home } from 'lucide-react';
import { cn } from '@/lib/utils';

export function AdminBreadcrumbs() {
  const pathname = usePathname();

  // Génère les breadcrumbs depuis le pathname
  const generateBreadcrumbs = () => {
    const segments = pathname.split('/').filter(Boolean);
    const breadcrumbs: Array<{ label: string; href: string }> = [];

    // Toujours commencer par Home/Admin
    breadcrumbs.push({ label: 'Admin', href: '/admin' });

    // Construire les segments
    let currentPath = '';
    segments.forEach((segment, index) => {
      if (segment === 'admin') {
        return; // Skip 'admin' car déjà ajouté
      }
      currentPath += `/${segment}`;
      
      // Formater le label (capitalize, remplacer - par espace)
      const label = segment
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');

      breadcrumbs.push({
        label,
        href: `/admin${currentPath}`,
      });
    });

    return breadcrumbs;
  };

  const breadcrumbs = generateBreadcrumbs();

  return (
    <nav className="flex items-center gap-2 text-sm" aria-label="Breadcrumb">
      <Link
        href="/admin"
        className="flex items-center text-zinc-400 hover:text-white transition-colors"
      >
        <Home className="w-4 h-4" />
      </Link>
      {breadcrumbs.length > 1 && (
        <>
          <ChevronRight className="w-4 h-4 text-zinc-600" />
          {breadcrumbs.slice(1).map((crumb, index) => {
            const isLast = index === breadcrumbs.length - 2;
            return (
              <React.Fragment key={crumb.href}>
                {isLast ? (
                  <span className="text-white font-medium">{crumb.label}</span>
                ) : (
                  <>
                    <Link
                      href={crumb.href}
                      className="text-zinc-400 hover:text-white transition-colors"
                    >
                      {crumb.label}
                    </Link>
                    <ChevronRight className="w-4 h-4 text-zinc-600" />
                  </>
                )}
              </React.Fragment>
            );
          })}
        </>
      )}
    </nav>
  );
}
