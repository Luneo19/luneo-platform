import { redirect } from 'next/navigation';

/**
 * /dashboard/designs/new redirects to the AI Studio where designs are created.
 * This page exists because the PWA manifest shortcut and external links may
 * reference this URL.
 */
export default function NewDesignPage() {
  redirect('/dashboard/ai-studio');
}
