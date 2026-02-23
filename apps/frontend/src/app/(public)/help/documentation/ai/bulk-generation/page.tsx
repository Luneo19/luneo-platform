'use client';

import React, { memo, useCallback, useMemo } from 'react';
import { Copy, CheckCircle } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { DocPageTemplate } from '@/components/docs/DocPageTemplate';

function KnowledgeBasesPageContent() {
  const [copied, setCopied] = React.useState<string>('');

  const copyCode = useCallback((code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopied(id);
    setTimeout(() => setCopied(''), 2000);
  }, []);

  const createKbExample = useMemo(() => `const response = await fetch('https://api.luneo.app/api/v1/knowledge-bases', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_API_KEY',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    name: "Documentation Produit",
    description: "Base de connaissances pour le support client",
    embedding_model: "text-embedding-3-large",
    chunk_size: 512,
    chunk_overlap: 50
  })
});

const kb = await response.json();`, []);

  const uploadExample = useMemo(() => `const formData = new FormData();
formData.append('file', pdfFile);
formData.append('metadata', JSON.stringify({
  source: 'documentation',
  category: 'produit'
}));

const response = await fetch(
  'https://api.luneo.app/api/v1/knowledge-bases/kb_abc123/documents',
  {
    method: 'POST',
    headers: { 'Authorization': 'Bearer YOUR_API_KEY' },
    body: formData
  }
);`, []);

  const crawlExample = useMemo(() => `const response = await fetch(
  'https://api.luneo.app/api/v1/knowledge-bases/kb_abc123/crawl',
  {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer YOUR_API_KEY',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      url: "https://docs.monsite.fr",
      max_pages: 100,
      include_patterns: ["/docs/*", "/faq/*"],
      exclude_patterns: ["/blog/*"],
      sync_schedule: "weekly"
    })
  }
);`, []);

  const formats = useMemo(() => [
    { format: 'PDF', ext: '.pdf', desc: 'Documents, manuels, rapports' },
    { format: 'Word', ext: '.docx', desc: 'Documents texte enrichi' },
    { format: 'Markdown', ext: '.md', desc: 'Documentation technique' },
    { format: 'Texte brut', ext: '.txt', desc: 'Fichiers texte simples' },
    { format: 'CSV', ext: '.csv', desc: 'Données tabulaires, FAQ' },
    { format: 'HTML', ext: '.html', desc: 'Pages web exportées' },
  ], []);

  return (
    <DocPageTemplate
      title="Bases de connaissances"
      description="Créez et gérez vos bases de connaissances vectorielles pour le RAG (Retrieval Augmented Generation)"
      breadcrumbs={[
        { label: 'Documentation', href: '/help/documentation' },
        { label: 'IA', href: '/help/documentation/ai' },
        { label: 'Bases de connaissances', href: '/help/documentation/ai/bulk-generation' }
      ]}
      relatedLinks={[
        { title: 'Configuration IA', href: '/help/documentation/ai/generation', description: 'Configurer les modèles' },
        { title: 'Premiers pas', href: '/help/documentation/ai/getting-started', description: 'Introduction à l\'IA' }
      ]}
    >
      <Card className="bg-white/[0.02] border-white/[0.06] p-6 mb-8">
        <h2 className="text-2xl font-bold text-white mb-3">Qu'est-ce que le RAG ?</h2>
        <p className="text-white/60 mb-4">
          Le RAG (Retrieval Augmented Generation) permet à vos agents IA de répondre en s'appuyant sur
          vos propres données. Vos documents sont découpés en chunks, vectorisés via des embeddings,
          puis stockés dans une base vectorielle (Pinecone). Lors d'une question, les passages les plus
          pertinents sont récupérés et injectés dans le contexte du modèle.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="p-3 bg-white/[0.02] border border-white/[0.06] rounded-lg text-center">
            <div className="text-2xl mb-1">📄</div>
            <p className="text-sm font-medium text-white">1. Import</p>
            <p className="text-xs text-white/40">Documents, URLs, fichiers</p>
          </div>
          <div className="p-3 bg-white/[0.02] border border-white/[0.06] rounded-lg text-center">
            <div className="text-2xl mb-1">🔢</div>
            <p className="text-sm font-medium text-white">2. Vectorisation</p>
            <p className="text-xs text-white/40">Embeddings + Pinecone</p>
          </div>
          <div className="p-3 bg-white/[0.02] border border-white/[0.06] rounded-lg text-center">
            <div className="text-2xl mb-1">💬</div>
            <p className="text-sm font-medium text-white">3. Réponse</p>
            <p className="text-xs text-white/40">Contexte enrichi + LLM</p>
          </div>
        </div>
      </Card>

      <Card className="bg-white/[0.02] border-white/[0.06] p-6 mb-8">
        <h2 className="text-2xl font-bold text-white mb-4">Formats supportés</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {formats.map((f) => (
            <div key={f.format} className="p-3 bg-white/[0.02] border border-white/[0.06] rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-medium text-white text-sm">{f.format}</span>
                <code className="text-xs text-purple-400">{f.ext}</code>
              </div>
              <p className="text-xs text-white/40">{f.desc}</p>
            </div>
          ))}
        </div>
      </Card>

      <Card className="bg-white/[0.02] border-white/[0.06] p-6 mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-white">Créer une base de connaissances</h2>
          <button
            onClick={() => copyCode(createKbExample, 'create')}
            className="p-2 bg-white/[0.04] hover:bg-white/[0.08] rounded-lg border border-white/[0.06]"
          >
            {copied === 'create' ? (
              <CheckCircle className="w-4 h-4 text-green-400" />
            ) : (
              <Copy className="w-4 h-4 text-white/40" />
            )}
          </button>
        </div>
        <div className="bg-black/40 rounded-lg p-4">
          <pre className="text-sm text-white/70 overflow-x-auto">
            <code>{createKbExample}</code>
          </pre>
        </div>
      </Card>

      <Card className="bg-white/[0.02] border-white/[0.06] p-6 mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-white">Importer des documents</h2>
          <button
            onClick={() => copyCode(uploadExample, 'upload')}
            className="p-2 bg-white/[0.04] hover:bg-white/[0.08] rounded-lg border border-white/[0.06]"
          >
            {copied === 'upload' ? (
              <CheckCircle className="w-4 h-4 text-green-400" />
            ) : (
              <Copy className="w-4 h-4 text-white/40" />
            )}
          </button>
        </div>
        <div className="bg-black/40 rounded-lg p-4">
          <pre className="text-sm text-white/70 overflow-x-auto">
            <code>{uploadExample}</code>
          </pre>
        </div>
      </Card>

      <Card className="bg-white/[0.02] border-white/[0.06] p-6 mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-white">Crawler un site web</h2>
          <button
            onClick={() => copyCode(crawlExample, 'crawl')}
            className="p-2 bg-white/[0.04] hover:bg-white/[0.08] rounded-lg border border-white/[0.06]"
          >
            {copied === 'crawl' ? (
              <CheckCircle className="w-4 h-4 text-green-400" />
            ) : (
              <Copy className="w-4 h-4 text-white/40" />
            )}
          </button>
        </div>
        <div className="bg-black/40 rounded-lg p-4">
          <pre className="text-sm text-white/70 overflow-x-auto">
            <code>{crawlExample}</code>
          </pre>
        </div>
      </Card>

      <Card className="bg-blue-500/10 border-blue-500/20 p-6">
        <h3 className="text-xl font-bold text-white mb-3">Optimisation</h3>
        <ul className="space-y-2 text-sm text-white/60">
          <li>• Choisissez un <code className="bg-white/[0.06] px-1.5 py-0.5 rounded text-purple-400">chunk_size</code> entre 256 et 1024 selon la granularité souhaitée</li>
          <li>• Ajoutez des métadonnées (catégorie, source) pour filtrer les résultats lors de la recherche</li>
          <li>• Activez la synchronisation automatique pour les sources web dynamiques</li>
          <li>• Utilisez <code className="bg-white/[0.06] px-1.5 py-0.5 rounded text-purple-400">text-embedding-3-large</code> pour une meilleure précision sémantique</li>
          <li>• Supprimez les documents obsolètes pour maintenir la qualité des réponses</li>
        </ul>
      </Card>
    </DocPageTemplate>
  );
}

const KnowledgeBasesPageMemo = memo(KnowledgeBasesPageContent);

export default function KnowledgeBasesPage() {
  return (
    <ErrorBoundary componentName="KnowledgeBasesPage">
      <KnowledgeBasesPageMemo />
    </ErrorBoundary>
  );
}
