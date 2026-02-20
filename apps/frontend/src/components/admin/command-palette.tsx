/**
 * ★★★ COMMAND PALETTE ★★★
 * Palette de commandes pour navigation rapide dans le Super Admin Dashboard
 * Raccourci: Cmd+K (Mac) / Ctrl+K (Windows/Linux)
 * Features: global search, quick actions, navigation shortcuts, recent items, keyboard hints
 */

'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
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
  Home,
  ChevronRight,
  Ticket,
  Plus,
  Palette,
  Moon,
  Sun,
  Package,
  ShoppingCart,
  Store,
  Plug,
  MessageSquare,
  Box,
  Sparkles,
  Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTheme } from 'next-themes';
import { endpoints } from '@/lib/api/client';
import { logger } from '@/lib/logger';

const RECENT_STORAGE_KEY = 'luneo-admin-recent';
const RECENT_MAX = 8;

interface Command {
  id: string;
  title: string;
  description?: string;
  icon: React.ReactNode;
  category: string;
  keywords: string[];
  shortcut?: string;
  path?: string; // for recent items
  action: () => void;
}

interface SearchResultItem {
  id: string;
  type: 'product' | 'design' | 'order' | 'customer';
  title: string;
  subtitle?: string;
  path: string;
}

interface RecentItem {
  path: string;
  title: string;
}

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function getRecentItems(): RecentItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = sessionStorage.getItem(RECENT_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as RecentItem[];
    return Array.isArray(parsed) ? parsed.slice(0, RECENT_MAX) : [];
  } catch {
    return [];
  }
}

function pushRecent(path: string, title: string) {
  if (typeof window === 'undefined') return;
  try {
    const prev = getRecentItems();
    const next = [{ path, title }, ...prev.filter((r) => r.path !== path)].slice(0, RECENT_MAX);
    sessionStorage.setItem(RECENT_STORAGE_KEY, JSON.stringify(next));
  } catch {
    // ignore
  }
}

export function CommandPalette({ open, onOpenChange }: CommandPaletteProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { setTheme, resolvedTheme } = useTheme();
  const [search, setSearch] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [searchResults, setSearchResults] = useState<SearchResultItem[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [recentItems, setRecentItems] = useState<RecentItem[]>([]);

  // Quick actions + Navigation (admin + dashboard) + existing nav
  const commands: Command[] = useMemo(() => {
    const nav: Command[] = [
      {
        id: 'dashboard',
        title: 'Dashboard Overview',
        description: 'View platform metrics and KPIs',
        icon: <Home className="w-4 h-4" />,
        category: 'Navigation',
        keywords: ['dashboard', 'overview', 'home', 'metrics'],
        shortcut: 'G D',
        path: '/admin',
        action: () => router.push('/admin'),
      },
      {
        id: 'customers',
        title: 'Customers',
        description: 'Manage all customers',
        icon: <Users className="w-4 h-4" />,
        category: 'Navigation',
        keywords: ['customers', 'users', 'clients'],
        shortcut: 'G C',
        path: '/admin/customers',
        action: () => router.push('/admin/customers'),
      },
      {
        id: 'analytics',
        title: 'Analytics',
        description: 'View business analytics and reports',
        icon: <BarChart3 className="w-4 h-4" />,
        category: 'Navigation',
        keywords: ['analytics', 'reports', 'metrics', 'stats'],
        shortcut: 'G A',
        path: '/admin/analytics',
        action: () => router.push('/admin/analytics'),
      },
      {
        id: 'marketing',
        title: 'Email Marketing',
        description: 'Manage email automations and campaigns',
        icon: <Mail className="w-4 h-4" />,
        category: 'Navigation',
        keywords: ['marketing', 'email', 'automation', 'campaigns'],
        path: '/admin/marketing/automations',
        action: () => router.push('/admin/marketing/automations'),
      },
      {
        id: 'ads',
        title: 'Ads & Integrations',
        description: 'Manage ad platform integrations',
        icon: <TrendingUp className="w-4 h-4" />,
        category: 'Navigation',
        keywords: ['ads', 'integrations', 'meta', 'google', 'tiktok'],
        path: '/admin/ads',
        action: () => router.push('/admin/ads'),
      },
      {
        id: 'webhooks',
        title: 'Webhooks',
        description: 'Manage webhooks and events',
        icon: <Webhook className="w-4 h-4" />,
        category: 'Navigation',
        keywords: ['webhooks', 'events', 'integrations'],
        path: '/admin/webhooks',
        action: () => router.push('/admin/webhooks'),
      },
      {
        id: 'events',
        title: 'Event Logs',
        description: 'View system event logs',
        icon: <FileText className="w-4 h-4" />,
        category: 'Navigation',
        keywords: ['events', 'logs', 'history'],
        path: '/admin/events',
        action: () => router.push('/admin/events'),
      },
      {
        id: 'revenue',
        title: 'Revenue Analytics',
        description: 'View revenue metrics and trends',
        icon: <DollarSign className="w-4 h-4" />,
        category: 'Analytics',
        keywords: ['revenue', 'mrr', 'arr', 'money'],
        path: '/admin/analytics',
        action: () => router.push('/admin/analytics?tab=revenue'),
      },
      {
        id: 'tickets',
        title: 'Support Tickets',
        description: 'View and manage support tickets',
        icon: <Ticket className="w-4 h-4" />,
        category: 'Navigation',
        keywords: ['tickets', 'support', 'help', 'issues'],
        path: '/admin/tickets',
        action: () => router.push('/admin/tickets'),
      },
      {
        id: 'settings',
        title: 'Settings',
        description: 'Platform settings and configuration',
        icon: <Settings className="w-4 h-4" />,
        category: 'Navigation',
        keywords: ['settings', 'config', 'preferences'],
        shortcut: ',',
        path: '/admin/settings',
        action: () => router.push('/admin/settings'),
      },
    ];

    const quickActions: Command[] = [
      {
        id: 'quick-create-product',
        title: 'Create product',
        description: 'Go to products and add new',
        icon: <Plus className="w-4 h-4" />,
        category: 'Quick actions',
        keywords: ['create', 'product', 'new'],
        path: '/dashboard/products',
        action: () => router.push('/dashboard/products'),
      },
      {
        id: 'quick-create-design',
        title: 'Create design',
        description: 'Open AI Studio to create a design',
        icon: <Palette className="w-4 h-4" />,
        category: 'Quick actions',
        keywords: ['create', 'design', 'ai', 'studio'],
        path: '/dashboard/ai-studio',
        action: () => router.push('/dashboard/ai-studio'),
      },
      {
        id: 'quick-analytics',
        title: 'View analytics',
        description: 'Open analytics dashboard',
        icon: <BarChart3 className="w-4 h-4" />,
        category: 'Quick actions',
        keywords: ['analytics', 'view', 'reports'],
        path: '/admin/analytics',
        action: () => router.push('/admin/analytics'),
      },
      {
        id: 'quick-settings',
        title: 'Open settings',
        description: 'Platform settings',
        icon: <Settings className="w-4 h-4" />,
        category: 'Quick actions',
        keywords: ['settings', 'open', 'config'],
        path: '/admin/settings',
        action: () => router.push('/admin/settings'),
      },
      {
        id: 'quick-dark-mode',
        title: 'Toggle dark mode',
        description: resolvedTheme === 'dark' ? 'Switch to light' : 'Switch to dark',
        icon: resolvedTheme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />,
        category: 'Quick actions',
        keywords: ['dark', 'light', 'theme', 'mode'],
        shortcut: '⌘⇧D',
        action: () => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark'),
      },
    ];

    const dashboardNav: Command[] = [
      { id: 'nav-products', title: 'Products', path: '/dashboard/products', description: 'Dashboard products', icon: <Package className="w-4 h-4" />, category: 'Dashboard', keywords: ['products', 'catalog'], action: () => router.push('/dashboard/products') },
      { id: 'nav-customizer', title: 'Customization', path: '/dashboard/customizer', description: 'Visual customizer', icon: <Palette className="w-4 h-4" />, category: 'Dashboard', keywords: ['customizer', 'customization'], action: () => router.push('/dashboard/customizer') },
      { id: 'nav-ai-studio', title: 'AI Studio', path: '/dashboard/ai-studio', description: 'AI design generation', icon: <Sparkles className="w-4 h-4" />, category: 'Dashboard', keywords: ['ai', 'studio', 'design'], action: () => router.push('/dashboard/ai-studio') },
      { id: 'nav-ar-studio', title: 'AR Studio', path: '/dashboard/ar-studio', description: 'AR projects', icon: <Box className="w-4 h-4" />, category: 'Dashboard', keywords: ['ar', 'studio'], action: () => router.push('/dashboard/ar-studio') },
      { id: 'nav-designs', title: 'Designs', path: '/dashboard/designs', description: 'Design library', icon: <Palette className="w-4 h-4" />, category: 'Dashboard', keywords: ['designs', 'library'], action: () => router.push('/dashboard/designs') },
      { id: 'nav-orders', title: 'Orders', path: '/dashboard/orders', description: 'Order management', icon: <ShoppingCart className="w-4 h-4" />, category: 'Dashboard', keywords: ['orders'], action: () => router.push('/dashboard/orders') },
      { id: 'nav-marketplace', title: 'Marketplace', path: '/dashboard/marketplace', description: 'Browse marketplace', icon: <Store className="w-4 h-4" />, category: 'Dashboard', keywords: ['marketplace'], action: () => router.push('/dashboard/marketplace') },
      { id: 'nav-analytics', title: 'Analytics', path: '/dashboard/analytics', description: 'Dashboard analytics', icon: <BarChart3 className="w-4 h-4" />, category: 'Dashboard', keywords: ['analytics'], action: () => router.push('/dashboard/analytics') },
      { id: 'nav-integrations', title: 'Integrations', path: '/dashboard/integrations-dashboard', description: 'Integrations dashboard', icon: <Plug className="w-4 h-4" />, category: 'Dashboard', keywords: ['integrations'], action: () => router.push('/dashboard/integrations-dashboard') },
      { id: 'nav-support', title: 'Support', path: '/dashboard/support', description: 'Support portal', icon: <MessageSquare className="w-4 h-4" />, category: 'Dashboard', keywords: ['support'], action: () => router.push('/dashboard/support') },
      { id: 'nav-settings', title: 'Settings', path: '/dashboard/settings', description: 'Dashboard settings', icon: <Settings className="w-4 h-4" />, category: 'Dashboard', keywords: ['settings'], action: () => router.push('/dashboard/settings') },
    ];

    return [...quickActions, ...nav, ...dashboardNav];
  }, [router, resolvedTheme, setTheme]);

  // Global search: products, designs, orders, customers (debounced)
  useEffect(() => {
    const q = search.trim();
    if (q.length < 2) {
      setSearchResults([]);
      setSearchLoading(false);
      return;
    }
    let cancelled = false;
    setSearchLoading(true);
    const t = setTimeout(async () => {
      try {
        const [productsRes, designsRes, ordersRes, clientsRes] = await Promise.allSettled([
          endpoints.products.list({ limit: 10, page: 1 }).then((r: unknown) => r),
          endpoints.designs.list({ limit: 5, search: q }).then((r: unknown) => r),
          endpoints.orders.list({ limit: 5, search: q }).then((r: unknown) => r),
          endpoints.admin.clients.list({ limit: 5, search: q }).then((r: unknown) => r),
        ]);
        if (cancelled) return;
        const results: SearchResultItem[] = [];
        const qLower = q.toLowerCase();
        if (productsRes.status === 'fulfilled') {
          const raw = productsRes.value as { data?: { products?: { id?: string; name?: string }[] }; products?: { id?: string; name?: string }[] };
          const list = raw?.data?.products ?? raw?.products ?? (Array.isArray(raw?.data) ? raw.data : []) ?? [];
          (Array.isArray(list) ? list : []).slice(0, 5).forEach((p: { id?: string; name?: string }) => {
            if (p?.id && (p.name?.toLowerCase().includes(qLower) || p.id.toLowerCase().includes(qLower)))
              results.push({ id: p.id, type: 'product', title: p.name ?? p.id, path: `/dashboard/products/${p.id}` });
          });
        }
        if (designsRes.status === 'fulfilled') {
          const data = designsRes.value as { designs?: { id?: string; name?: string }[]; data?: { id?: string; name?: string }[] };
          const list = data?.designs ?? data?.data ?? [];
          (Array.isArray(list) ? list : []).slice(0, 5).forEach((d: { id?: string; name?: string }) => {
            if (d?.id) results.push({ id: d.id, type: 'design', title: (d.name ?? d.id).slice(0, 50), path: `/dashboard/designs/${d.id}` });
          });
        }
        if (ordersRes.status === 'fulfilled') {
          const raw = ordersRes.value as { data?: { orders?: { id?: string; orderNumber?: string }[] }; orders?: { id?: string; orderNumber?: string }[] };
          const list = raw?.data?.orders ?? raw?.orders ?? (Array.isArray(raw?.data) ? raw.data : []) ?? [];
          (Array.isArray(list) ? list : []).slice(0, 5).forEach((o: { id?: string; orderNumber?: string }) => {
            if (o?.id) results.push({ id: o.id, type: 'order', title: `Order ${o.orderNumber ?? o.id}`, path: `/dashboard/orders/${o.id}` });
          });
        }
        if (clientsRes.status === 'fulfilled') {
          const data = clientsRes.value as { data?: { id?: string; email?: string; name?: string }[] };
          const list = data?.data ?? [];
          (Array.isArray(list) ? list : []).slice(0, 5).forEach((c: { id?: string; email?: string; name?: string }) => {
            if (c?.id) results.push({ id: c.id, type: 'customer', title: c.name ?? c.email ?? c.id, subtitle: c.email, path: `/admin/customers/${c.id}` });
          });
        }
        if (!cancelled) setSearchResults(results);
      } catch (e) {
        logger.error('Command palette search failed', e);
        if (!cancelled) setSearchResults([]);
      } finally {
        if (!cancelled) setSearchLoading(false);
      }
    }, 280);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [search]);

  // Load recent when palette opens
  useEffect(() => {
    if (open) setRecentItems(getRecentItems());
  }, [open]);

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
      if (command.path) pushRecent(command.path, command.title);
      onOpenChange(false);
      setSearch('');
      setSelectedIndex(0);
    },
    [onOpenChange],
  );

  const handleSelectSearchResult = useCallback(
    (item: SearchResultItem) => {
      pushRecent(item.path, item.title);
      router.push(item.path);
      onOpenChange(false);
      setSearch('');
      setSelectedIndex(0);
    },
    [router, onOpenChange],
  );

  // Combined list for arrow/enter: search results (when searching) or recent + commands
  const hasSearchQuery = search.trim().length >= 2;
  type ListItem = { type: 'search'; item: SearchResultItem } | { type: 'recent'; item: RecentItem } | { type: 'command'; command: Command };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const flatList: ListItem[] = hasSearchQuery
    ? [...searchResults.map((item) => ({ type: 'search' as const, item })), ...filteredCommands.map((command) => ({ type: 'command' as const, command }))]
    : [...recentItems.map((item) => ({ type: 'recent' as const, item })), ...filteredCommands.map((command) => ({ type: 'command' as const, command }))];

  const handleSelectByIndex = useCallback(
    (idx: number) => {
      const entry = flatList[idx];
      if (!entry) return;
      if (entry.type === 'search') handleSelectSearchResult(entry.item);
      else if (entry.type === 'recent') {
        pushRecent(entry.item.path, entry.item.title);
        router.push(entry.item.path);
        onOpenChange(false);
        setSearch('');
        setSelectedIndex(0);
      } else handleSelect(entry.command);
    },
    [flatList, handleSelectSearchResult, handleSelect, router, onOpenChange],
  );

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!open) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev < flatList.length - 1 ? prev + 1 : prev));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : 0));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        handleSelectByIndex(selectedIndex);
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onOpenChange(false);
        setSearch('');
        setSelectedIndex(0);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, flatList.length, selectedIndex, handleSelectByIndex, onOpenChange]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [search]);

  useEffect(() => {
    setSelectedIndex((i) => Math.min(i, Math.max(0, flatList.length - 1)));
  }, [flatList.length]);

  // Group commands by category (for display only)
  const groupedCommands = filteredCommands.reduce((acc, cmd) => {
    if (!acc[cmd.category]) {
      acc[cmd.category] = [];
    }
    acc[cmd.category].push(cmd);
    return acc;
  }, {} as Record<string, Command[]>);

  const typeIcon = (type: SearchResultItem['type']) => {
    switch (type) {
      case 'product': return <Package className="w-4 h-4" />;
      case 'design': return <Palette className="w-4 h-4" />;
      case 'order': return <ShoppingCart className="w-4 h-4" />;
      case 'customer': return <Users className="w-4 h-4" />;
    }
  };

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
          {hasSearchQuery && searchLoading && searchResults.length === 0 && (
            <div className="flex items-center gap-2 py-4 text-zinc-500">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-sm">Searching…</span>
            </div>
          )}
          {flatList.length === 0 && !searchLoading ? (
            <div className="py-8 text-center text-zinc-500">
              No commands found
            </div>
          ) : (
            <div className="space-y-1">
              {flatList.map((entry, idx) => {
                const isSelected = idx === selectedIndex;
                const rowClass = cn(
                  'w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-left',
                  isSelected ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:bg-zinc-800/50 hover:text-white',
                );
                if (entry.type === 'search') {
                  return (
                    <button
                      key={`search-${entry.item.type}-${entry.item.id}`}
                      type="button"
                      onClick={() => handleSelectSearchResult(entry.item)}
                      className={rowClass}
                    >
                      <div className="flex-shrink-0">{typeIcon(entry.item.type)}</div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium">{entry.item.title}</div>
                        {entry.item.subtitle && (
                          <div className="text-xs text-zinc-500 truncate">{entry.item.subtitle}</div>
                        )}
                      </div>
                      <span className="text-xs text-zinc-500 capitalize">{entry.item.type}</span>
                      <ChevronRight className="w-4 h-4 text-zinc-600" />
                    </button>
                  );
                }
                if (entry.type === 'recent') {
                  return (
                    <button
                      key={`recent-${entry.item.path}`}
                      type="button"
                      onClick={() => {
                        pushRecent(entry.item.path, entry.item.title);
                        router.push(entry.item.path);
                        onOpenChange(false);
                        setSearch('');
                        setSelectedIndex(0);
                      }}
                      className={rowClass}
                    >
                      <div className="flex-shrink-0">
                        <FileText className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium">{entry.item.title}</div>
                        <div className="text-xs text-zinc-500 truncate">{entry.item.path}</div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-zinc-600" />
                    </button>
                  );
                }
                const cmd = entry.command;
                return (
                  <button
                    key={cmd.id}
                    type="button"
                    onClick={() => handleSelect(cmd)}
                    className={rowClass}
                  >
                    <div className="flex-shrink-0">{cmd.icon}</div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium">{cmd.title}</div>
                      {cmd.description && (
                        <div className="text-xs text-zinc-500 truncate">{cmd.description}</div>
                      )}
                    </div>
                    {cmd.shortcut && (
                      <kbd className="hidden sm:inline-flex px-2 py-0.5 text-xs bg-zinc-800 border border-zinc-700 rounded">
                        {cmd.shortcut}
                      </kbd>
                    )}
                    <ChevronRight className="w-4 h-4 text-zinc-600" />
                  </button>
                );
              })}
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
