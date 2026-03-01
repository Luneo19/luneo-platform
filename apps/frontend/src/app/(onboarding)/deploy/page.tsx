'use client';

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

const WIDGET_SNIPPET = `<script
  src="https://cdn.luneo.app/widget/v2/luneo-widget.js"
  data-brand="your-brand-id"
  data-agent="your-agent-id"
  defer
></script>`;

export default function OnboardingDeployPage() {
  return (
    <main className="min-h-screen bg-[#0a0a0f] text-white p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <header className="space-y-2">
          <h1 className="text-3xl font-semibold">Deployer le widget</h1>
          <p className="text-white/60">
            Copiez le script ci-dessous dans le `head` ou en bas du `body` de votre site.
          </p>
        </header>

        <Card className="bg-white/[0.03] border-white/[0.08] p-6 space-y-4">
          <Textarea value={WIDGET_SNIPPET} readOnly className="min-h-40 font-mono text-xs" />
          <div className="flex gap-3">
            <Button onClick={() => navigator.clipboard.writeText(WIDGET_SNIPPET)}>Copier le script</Button>
            <Button variant="outline">Verifier l&apos;installation</Button>
          </div>
        </Card>
      </div>
    </main>
  );
}
