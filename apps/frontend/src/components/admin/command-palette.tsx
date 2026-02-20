/**
 * ★★★ COMMAND PALETTE ★★★
 * Palette de commandes pour navigation rapide dans le Super Admin Dashboard
 * Raccourci: Cmd+K (Mac) / Ctrl+K (Windows/Linux)
 */

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Search,
  Users,
  BarChart3,
  Mail,
  Settings,
  Webhook,
  FileText,
  TrendingUp,
  DollarSign,
  UserCircle,
  Bell,
  Zap,
  Home,
  ChevronRight,
  Ticket,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Command {
  id: string;
  title: string;
  description?: string;
  icon: React.ReactNode;
  category: string;
  keywords: string[];
  action: () => void;
}

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CommandPalette({ open, onOpenChange }: CommandPaletteProps) {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);

  const commands: Command[] = [
    {
      id: 'dashboard',
      title: 'Dashboard Overview',
      description: 'View platform metrics and KPIs',
      icon: <Home className="w-4 h-4" />,
      category: 'Navigation',
      keywords: ['dashboard', 'overview', 'home', 'metrics'],
      action: () => router.push('/admin'),
    },
    {
      id: 'customers',
      title: 'Customers',
      description: 'Manage all customers',
      icon: <Users className="w-4 h-4" />,
      category: 'Navigation',
      keywords: ['customers', 'users', 'clients'],
      action: () => router.push('/admin/customers'),
    },
    {
      id: 'analytics',
      title: 'Analytics',
      description: 'View business analytics and reports',
      icon: <BarChart3 className="w-4 h-4" />,
      category: 'Navigation',
      keywords: ['analytics', 'reports', 'metrics', 'stats'],
      action: () => router.push('/admin/analytics'),
    },
    {
      id: 'marketing',
      title: 'Email Marketing',
      description: 'Manage email automations and campaigns',
      icon: <Mail className="w-4 h-4" />,
      category: 'Navigation',
      keywords: ['marketing', 'email', 'automation', 'campaigns'],
      action: () => router.push('/admin/marketing/automations'),
    },
    {
      id: 'ads',
      title: 'Ads & Integrations',
      description: 'Manage ad platform integrations',
      icon: <TrendingUp className="w-4 h-4" />,
      category: 'Navigation',
      keywords: ['ads', 'integrations', 'meta', 'google', 'tiktok'],
      action: () => router.push('/admin/ads'),
    },
    {
      id: 'webhooks',
      title: 'Webhooks',
      description: 'Manage webhooks and events',
      icon: <Webhook className="w-4 h-4" />,
      category: 'Navigation',
      keywords: ['webhooks', 'events', 'integrations'],
      action: () => router.push('/admin/webhooks'),
    },
    {
      id: 'events',
      title: 'Event Logs',
      description: 'View system event logs',
      icon: <FileText className="w-4 h-4" />,
      category: 'Navigation',
      keywords: ['events', 'logs', 'history'],
      action: () => router.push('/admin/events'),
    },
    {
      id: 'revenue',
      title: 'Revenue Analytics',
      description: 'View revenue metrics and trends',
      icon: <DollarSign className="w-4 h-4" />,
      category: 'Analytics',
      keywords: ['revenue', 'mrr', 'arr', 'money'],
      action: () => router.push('/admin/analytics?tab=revenue'),
    },
    {
      id: 'tickets',
      title: 'Support Tickets',
      description: 'View and manage support tickets',
      icon: <Ticket className="w-4 h-4" />,
      category: 'Navigation',
      keywords: ['tickets', 'support', 'help', 'issues'],
      action: () => router.push('/admin/tickets'),
    },
    {
      id: 'settings',
      title: 'Settings',
      description: 'Platform settings and configuration',
      icon: <Settings className="w-4 h-4" />,
      category: 'Navigation',
      keywords: ['settings', 'config', 'preferences'],
      action: () => router.push('/admin/settings'),
    },
  ];

  const filteredCommands = commands.filter((cmd) => {
    const searchLower = search.toLowerCase();
    return (
      cmd.title.toLowerCase().includes(searchLower) ||
      cmd.description?.toLowerCase().includes(searchLower) ||
      cmd.keywords.some((kw) => kw.toLowerCase().includes(searchLower)) ||
      cmd.category.toLowerCase().includes(searchLower)
    );
  });

  const handleSelect = useCallback(
    (command: Command) => {
      command.action();
      onOpenChange(false);
      setSearch('');
      setSelectedIndex(0);
    },
    [onOpenChange],
  );

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!open) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev < filteredCommands.length - 1 ? prev + 1 : prev,
        );
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : 0));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (filteredCommands[selectedIndex]) {
          handleSelect(filteredCommands[selectedIndex]);
        }
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onOpenChange(false);
        setSearch('');
        setSelectedIndex(0);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, filteredCommands, selectedIndex, handleSelect, onOpenChange]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [search]);

  // Group commands by category
  const groupedCommands = filteredCommands.reduce((acc, cmd) => {
    if (!acc[cmd.category]) {
      acc[cmd.category] = [];
    }
    acc[cmd.category].push(cmd);
    return acc;
  }, {} as Record<string, Command[]>);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl p-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-zinc-800">
          <DialogTitle className="text-lg font-semibold text-white">
            Command Palette
          </DialogTitle>
        </DialogHeader>

        <div className="px-6 pt-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <Input
              placeholder="Type a command or search..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 bg-zinc-900 border-zinc-700 text-white"
              autoFocus
            />
          </div>
        </div>

        <div className="px-6 pb-6 mt-4 max-h-[400px] overflow-y-auto">
          {filteredCommands.length === 0 ? (
            <div className="py-8 text-center text-zinc-500">
              No commands found
            </div>
          ) : (
            <div className="space-y-4">
              {Object.entries(groupedCommands).map(([category, cmds]) => (
                <div key={category}>
                  <div className="text-xs font-semibold text-zinc-500 uppercase mb-2 px-2">
                    {category}
                  </div>
                  <div className="space-y-1">
                    {cmds.map((cmd, idx) => {
                      const globalIndex = filteredCommands.indexOf(cmd);
                      const isSelected = globalIndex === selectedIndex;
                      return (
                        <button
                          key={cmd.id}
                          onClick={() => handleSelect(cmd)}
                          className={cn(
                            'w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-left',
                            isSelected
                              ? 'bg-zinc-800 text-white'
                              : 'text-zinc-400 hover:bg-zinc-800/50 hover:text-white',
                          )}
                        >
                          <div className="flex-shrink-0">{cmd.icon}</div>
                          <div className="flex-1 min-w-0">
                            <div className="font-medium">{cmd.title}</div>
                            {cmd.description && (
                              <div className="text-xs text-zinc-500 truncate">
                                {cmd.description}
                              </div>
                            )}
                          </div>
                          <ChevronRight className="w-4 h-4 text-zinc-600" />
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="px-6 py-3 border-t border-zinc-800 flex items-center justify-between text-xs text-zinc-500">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
              <kbd className="px-2 py-1 bg-zinc-800 border border-zinc-700 rounded">
                ↑↓
              </kbd>
              <span>Navigate</span>
            </div>
            <div className="flex items-center gap-1">
              <kbd className="px-2 py-1 bg-zinc-800 border border-zinc-700 rounded">
                Enter
              </kbd>
              <span>Select</span>
            </div>
            <div className="flex items-center gap-1">
              <kbd className="px-2 py-1 bg-zinc-800 border border-zinc-700 rounded">
                Esc
              </kbd>
              <span>Close</span>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
