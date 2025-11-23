'use client';

import React from 'react';
import Link from 'next/link';
import { Copy, CheckCircle } from 'lucide-react';
import { Card } from '@/components/ui/card';

export default function BulkGenerationPage() {
  const [copied, setCopied] = React.useState('');
  const copyCode = (code: string, id: string) => { navigator.clipboard.writeText(code); setCopied(id); setTimeout(() => setCopied(''), 2000); };

  const example = `// Bulk Generation (1000 designs)
const job = await client.ai.bulkGenerate({
  prompts: ['Design 1', 'Design 2', ...], // 1000 prompts
  style: 'photorealistic',
  parallelWorkers: 10
});

// Monitor progress
job.on('progress', (percent) => {
  console.log(\`Progress: \${percent}%\`);
});

job.on('complete', (designs) => {
  console.log(\`Generated \${designs.length} designs\`);
});`;

  return (
    <div className="min-h-screen bg-gray-900 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <Link href="/help/documentation" className="text-blue-400 hover:text-blue-300 text-sm">← Documentation</Link>
          <h1 className="text-4xl font-bold text-white mb-4 mt-4">Bulk Generation</h1>
          <p className="text-xl text-gray-400">1000+ designs en parallèle</p>
        </div>

        <Card className="p-6 bg-gray-800/50 border-gray-700 mb-8">
          <h2 className="text-2xl font-bold text-white mb-4">Exemple</h2>
          <div className="relative">
            <pre className="bg-gray-900 border border-gray-700 rounded-lg p-4 overflow-x-auto text-sm text-gray-300 font-mono">{example}</pre>
            <button onClick={() => copyCode(example, 'ex')} className="absolute top-3 right-3 p-2 bg-gray-800 hover:bg-gray-700 rounded-lg border border-gray-600">
              {copied === 'ex' ? <CheckCircle className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4 text-gray-400" />}
            </button>
          </div>
        </Card>

        <Card className="p-6 bg-gray-800/50 border-gray-700">
          <h2 className="text-2xl font-bold text-white mb-4">Performance</h2>
          <div className="space-y-2 text-gray-300">
            <div className="flex gap-2"><CheckCircle className="w-5 h-5 text-purple-400" /> <strong>10 workers</strong> parallèles</div>
            <div className="flex gap-2"><CheckCircle className="w-5 h-5 text-purple-400" /> <strong>1000+ designs/h</strong></div>
            <div className="flex gap-2"><CheckCircle className="w-5 h-5 text-purple-400" /> BullMQ + Redis</div>
            <div className="flex gap-2"><CheckCircle className="w-5 h-5 text-purple-400" /> Auto-retry sur erreur</div>
          </div>
        </Card>
      </div>
    </div>
  );
}

