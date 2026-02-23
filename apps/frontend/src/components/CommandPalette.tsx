'use client';

import { useEffect, useState } from 'react';
import { Command } from 'cmdk';
import { useRouter } from 'next/navigation';
import {
  Bot,
  BarChart3,
  MessageSquare,
  Settings,
  CreditCard,
  Plus,
  Search,
} from 'lucide-react';

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    }
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, []);

  function runAction(path: string) {
    setOpen(false);
    router.push(path);
  }

  return (
    <Command.Dialog
      open={open}
      onOpenChange={setOpen}
      label="Palette de commandes"
      className="fixed inset-0 z-50"
    >
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm"
        onClick={() => setOpen(false)}
      />

      <div className="fixed left-1/2 top-[20%] z-50 w-full max-w-lg -translate-x-1/2">
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-2xl dark:border-gray-700 dark:bg-gray-900">
          <div className="flex items-center gap-2 border-b border-gray-200 px-4 dark:border-gray-700">
            <Search className="h-4 w-4 shrink-0 text-gray-400" />
            <Command.Input
              placeholder="Rechercher une action, un agent, une page…"
              className="w-full border-0 bg-transparent py-3 text-sm text-gray-900 outline-none placeholder:text-gray-400 dark:text-white"
            />
          </div>

          <Command.List className="max-h-80 overflow-y-auto p-2">
            <Command.Empty className="py-8 text-center text-sm text-gray-500">
              Aucun résultat trouvé.
            </Command.Empty>

            <Command.Group
              heading="Actions rapides"
              className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-gray-500"
            >
              <CommandItem
                icon={<Plus className="h-4 w-4" />}
                label="Créer un Agent"
                onSelect={() => runAction('/agents/new')}
              />
              <CommandItem
                icon={<BarChart3 className="h-4 w-4" />}
                label="Voir les Analytics"
                onSelect={() => runAction('/analytics')}
              />
              <CommandItem
                icon={<MessageSquare className="h-4 w-4" />}
                label="Voir les Conversations"
                onSelect={() => runAction('/conversations')}
              />
            </Command.Group>

            <Command.Group
              heading="Navigation"
              className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-gray-500"
            >
              <CommandItem
                icon={<Bot className="h-4 w-4" />}
                label="Mes Agents"
                onSelect={() => runAction('/agents')}
              />
              <CommandItem
                icon={<Settings className="h-4 w-4" />}
                label="Paramètres"
                onSelect={() => runAction('/settings')}
              />
              <CommandItem
                icon={<CreditCard className="h-4 w-4" />}
                label="Facturation"
                onSelect={() => runAction('/billing')}
              />
            </Command.Group>
          </Command.List>

          <div className="flex items-center justify-between border-t border-gray-200 px-4 py-2 text-xs text-gray-400 dark:border-gray-700">
            <div className="flex items-center gap-3">
              <span>
                <kbd className="rounded bg-gray-100 px-1.5 py-0.5 font-mono text-[10px] dark:bg-gray-800">
                  ↑↓
                </kbd>{' '}
                naviguer
              </span>
              <span>
                <kbd className="rounded bg-gray-100 px-1.5 py-0.5 font-mono text-[10px] dark:bg-gray-800">
                  ↵
                </kbd>{' '}
                sélectionner
              </span>
            </div>
            <span>
              <kbd className="rounded bg-gray-100 px-1.5 py-0.5 font-mono text-[10px] dark:bg-gray-800">
                esc
              </kbd>{' '}
              fermer
            </span>
          </div>
        </div>
      </div>
    </Command.Dialog>
  );
}

function CommandItem({
  icon,
  label,
  onSelect,
}: {
  icon: React.ReactNode;
  label: string;
  onSelect: () => void;
}) {
  return (
    <Command.Item
      onSelect={onSelect}
      className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-gray-700 transition-colors hover:bg-gray-100 aria-selected:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800 dark:aria-selected:bg-gray-800"
    >
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
        {icon}
      </span>
      {label}
    </Command.Item>
  );
}
