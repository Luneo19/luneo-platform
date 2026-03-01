'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';

export default function OnboardingCustomizePage() {
  const [tone, setTone] = useState('friendly');
  const [welcomeMessage, setWelcomeMessage] = useState('Bonjour, comment puis-je vous aider aujourd hui ?');
  const [avatarUrl, setAvatarUrl] = useState('');

  return (
    <main className="min-h-screen bg-[#0a0a0f] text-white p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <header className="space-y-2">
          <h1 className="text-3xl font-semibold">Personnaliser l&apos;agent</h1>
          <p className="text-white/60">
            Ajustez ton, avatar et message d&apos;accueil pre-remplis depuis l&apos;analyse de voix.
          </p>
        </header>

        <Card className="bg-white/[0.03] border-white/[0.08] p-6 space-y-4">
          <div className="space-y-2">
            <Label>Tonalite</Label>
            <Input value={tone} onChange={(event) => setTone(event.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Avatar URL</Label>
            <Input value={avatarUrl} onChange={(event) => setAvatarUrl(event.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Message d&apos;accueil</Label>
            <Textarea value={welcomeMessage} onChange={(event) => setWelcomeMessage(event.target.value)} />
          </div>
          <Button>Sauvegarder la personnalisation</Button>
        </Card>
      </div>
    </main>
  );
}
