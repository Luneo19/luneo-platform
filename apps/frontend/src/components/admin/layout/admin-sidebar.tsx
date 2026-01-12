/**
 * ★★★ ADMIN SIDEBAR ★★★
 * Sidebar pour le Super Admin Dashboard
 * Navigation groupée avec sous-menus, badges, tooltips
 */

'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { adminNavigation, type NavItem } from '@/config/admin-navigation';
import { cn } from '@/lib/utils';
import {
  ChevronRight,
  ChevronDown,
} from 'lucide-react';

export function AdminSidebar() {
  const pathname = usePathname();
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  const toggleExpanded = (href: string) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(href)) {
      newExpanded.delete(href);
    } else {
      newExpanded.add(href);
    }
    setExpandedItems(newExpanded);
  };

  const isActive = (href: string) => {
    if (href === '/admin') {
      return pathname === '/admin';
    }
    return pathname.startsWith(href);
  };

  const hasActiveChild = (item: NavItem): boolean => {
    if (!item.children) return false;
    return item.children.some(child => isActive(child.href));
  };

  return (
    <aside className="w-64 bg-zinc-900 border-r border-zinc-800 flex flex-col h-full">
      {/* Logo / Header */}
      <div className="h-16 flex items-center justify-between px-6 border-b border-zinc-800">
        <Link href="/admin" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">L</span>
          </div>
          <span className="text-white font-semibold text-sm">Super Admin</span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4">
        {adminNavigation.map((group, groupIndex) => (
          <div key={groupIndex} className="mb-6">
            {group.title && (
              <div className="px-6 mb-2">
                <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                  {group.title}
                </h3>
              </div>
            )}
            <ul className="space-y-1">
              {group.items.map((item) => (
                <NavItemComponent
                  key={item.href}
                  item={item}
                  pathname={pathname}
                  isActive={isActive(item.href)}
                  hasActiveChild={hasActiveChild(item)}
                  expanded={expandedItems.has(item.href)}
                  onToggle={() => toggleExpanded(item.href)}
                />
              ))}
            </ul>
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="h-16 border-t border-zinc-800 flex items-center justify-center">
        <span className="text-xs text-zinc-500">Luneo Platform v2.0</span>
      </div>
    </aside>
  );
}

interface NavItemComponentProps {
  item: NavItem;
  pathname: string;
  isActive: boolean;
  hasActiveChild: boolean;
  expanded: boolean;
  onToggle: () => void;
}

function NavItemComponent({
  item,
  pathname,
  isActive,
  hasActiveChild,
  expanded,
  onToggle,
}: NavItemComponentProps) {
  const Icon = item.icon;
  const hasChildren = item.children && item.children.length > 0;

  return (
    <li>
      <div>
        <Link
          href={item.href}
          onClick={(e) => {
            if (hasChildren) {
              e.preventDefault();
              onToggle();
            }
          }}
          className={cn(
            'flex items-center gap-3 px-6 py-2.5 text-sm font-medium transition-colors',
            'hover:bg-zinc-800 hover:text-white',
            isActive || hasActiveChild
              ? 'bg-zinc-800 text-white border-r-2 border-blue-500'
              : 'text-zinc-400',
          )}
        >
          <Icon className="w-5 h-5 flex-shrink-0" />
          <span className="flex-1">{item.title}</span>
          {item.badge && (
            <span className="px-2 py-0.5 text-xs font-semibold bg-blue-500 text-white rounded-full">
              {item.badge === 'live' ? '●' : item.badge}
            </span>
          )}
          {hasChildren && (
            <div className="flex-shrink-0">
              {expanded ? (
                <ChevronDown className="w-4 h-4" />
              ) : (
                <ChevronRight className="w-4 h-4" />
              )}
            </div>
          )}
        </Link>
        {hasChildren && expanded && (
          <ul className="bg-zinc-950/50 border-l border-zinc-800 ml-6">
            {item.children!.map((child) => {
              const ChildIcon = child.icon;
              const childIsActive = pathname === child.href;
              return (
                <li key={child.href}>
                  <Link
                    href={child.href}
                    className={cn(
                      'flex items-center gap-3 px-6 py-2 text-sm transition-colors',
                      'hover:bg-zinc-800 hover:text-white',
                      childIsActive
                        ? 'text-white bg-zinc-800'
                        : 'text-zinc-500',
                    )}
                  >
                    <ChildIcon className="w-4 h-4 flex-shrink-0" />
                    <span>{child.title}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </li>
  );
}
