'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export default function OnboardingTestPage() {
  const [messages, setMessages] = useState<string[]>([
    'Agent: Bonjour, je suis pret a vous aider.',
  ]);
  const [draft, setDraft] = useState('');

  return (
    <main className="min-h-screen bg-[#0a0a0f] text-white p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <header className="space-y-2">
          <h1 className="text-3xl font-semibold">Tester l&apos;agent en direct</h1>
          <p className="text-white/60">
            Simulez une conversation avant de deployer l&apos;agent sur votre site.
          </p>
        </header>

        <Card className="bg-white/[0.03] border-white/[0.08] p-6 space-y-4">
          <div className="h-72 overflow-y-auto rounded-lg border border-white/[0.08] p-4 space-y-3 bg-black/20">
            {messages.map((message) => (
              <p key={message} className="text-sm text-white/80">
                {message}
              </p>
            ))}
          </div>
          <div className="flex gap-2">
            <Input value={draft} onChange={(event) => setDraft(event.target.value)} placeholder="Poser une question de test..." />
            <Button
              onClick={() => {
                if (!draft.trim()) return;
                setMessages((prev) => [
                  ...prev,
                  `Client: ${draft}`,
                  `Agent: Merci, j ai bien pris en compte votre demande (${new Date().toLocaleTimeString()}).`,
                ]);
                setDraft('');
              }}
            >
              Envoyer
            </Button>
          </div>
        </Card>
      </div>
    </main>
  );
}
