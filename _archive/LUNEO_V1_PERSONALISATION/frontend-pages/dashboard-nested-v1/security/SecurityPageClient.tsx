/**
 * Client Component pour la page Security
 */

'use client';

import { SecurityHeader } from './components/SecurityHeader';
import { PasswordSection } from './components/PasswordSection';
import { SessionsSection } from './components/SessionsSection';
import { TwoFactorSection } from './components/TwoFactorSection';

export function SecurityPageClient() {
  return (
    <div className="space-y-6 pb-10">
      <SecurityHeader />
      <PasswordSection />
      <SessionsSection />
      <TwoFactorSection />
    </div>
  );
}



