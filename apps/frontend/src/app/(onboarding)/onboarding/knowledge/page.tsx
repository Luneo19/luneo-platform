'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';

export default function OnboardingKnowledgePage() {
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [progress, setProgress] = useState(0);
  const [started, setStarted] = useState(false);

  return (
    <main className="min-h-screen bg-[#0a0a0f] text-white p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <header className="space-y-2">
          <h1 className="text-3xl font-semibold">Importer la connaissance</h1>
          <p className="text-white/60">
            Lancez le crawling de votre site pour construire automatiquement la base de connaissance.
          </p>
        </header>

        <Card className="bg-white/[0.03] border-white/[0.08] p-6 space-y-4">
          <Input
            value={websiteUrl}
            onChange={(event) => setWebsiteUrl(event.target.value)}
            placeholder="https://votre-site.com"
            className="bg-white/[0.04] border-white/[0.08]"
          />
          <Button
            onClick={() => {
              setStarted(true);
              setProgress(20);
              setTimeout(() => setProgress(55), 600);
              setTimeout(() => setProgress(80), 1200);
              setTimeout(() => setProgress(100), 1800);
            }}
            disabled={!websiteUrl.trim()}
          >
            Demarrer le crawl
          </Button>
          {started ? (
            <div className="space-y-2">
              <Progress value={progress} className="h-2" />
              <p className="text-sm text-white/60">
                Progression du crawling: {progress}% (mode live branche au backend en etape suivante).
              </p>
            </div>
          ) : null}
        </Card>
      </div>
    </main>
  );
}
