'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export function useKeyboardShortcuts() {
  const router = useRouter();

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      const mod = e.metaKey || e.ctrlKey;
      if (!mod) return;

      if (e.key === 'k') {
        e.preventDefault();
        window.dispatchEvent(new CustomEvent('open-command-palette'));
        return;
      }

      if (e.key === 'n' && !e.shiftKey) {
        e.preventDefault();
        router.push('/agents/new');
        return;
      }

      if ((e.key === 'A' || e.key === 'a') && e.shiftKey) {
        e.preventDefault();
        router.push('/analytics');
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [router]);
}
