'use client';

import React, { memo, useCallback, useMemo } from 'react';
import { Copy, CheckCircle } from 'lucide-react';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { DocPageTemplate } from '@/components/docs/DocPageTemplate';

function ExamplesPageContent() {
  const [copied, setCopied] = React.useState<string>('');

  const copyCode = useCallback((code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopied(id);
    setTimeout(() => setCopied(''), 2000);
  }, []);

  const customerServiceExample = useMemo(() => `const agent = await fetch('https://api.luneo.app/api/v1/agents', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_API_KEY',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    name: "Agent Support Client",
    model: "claude-3-sonnet",
    temperature: 0.2,
    system_prompt: \`Tu es l'assistant support de [Entreprise].
Règles :
- Réponds toujours en français, de manière professionnelle et empathique
- Utilise la base de connaissances pour trouver les réponses
- Si le problème nécessite une intervention humaine, propose de transférer
- Ne donne jamais d'informations sur les prix sans vérifier la base
- Termine chaque réponse par "Puis-je vous aider avec autre chose ?"\`,
    max_tokens: 1024,
    knowledge_base_id: "kb_support_faq"
  })
});`, []);

  const ecommerceExample = useMemo(() => `const agent = await fetch('https://api.luneo.app/api/v1/agents', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_API_KEY',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    name: "Conseiller E-commerce",
    model: "gpt-4",
    temperature: 0.5,
    system_prompt: \`Tu es un conseiller shopping expert pour [Boutique].
Règles :
- Aide les clients à trouver le produit idéal selon leurs besoins
- Pose des questions pour comprendre le besoin (budget, usage, préférences)
- Recommande des produits du catalogue en citant les références
- Propose des alternatives si le produit est en rupture de stock
- Mentionne les promotions en cours quand c'est pertinent\`,
    max_tokens: 1536,
    knowledge_base_id: "kb_catalogue_produits"
  })
});`, []);

  const salesExample = useMemo(() => `const agent = await fetch('https://api.luneo.app/api/v1/agents', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_API_KEY',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    name: "Agent Commercial",
    model: "gpt-4",
    temperature: 0.6,
    system_prompt: \`Tu es un assistant commercial pour [Entreprise SaaS].
Règles :
- Qualifie les prospects en posant des questions sur leur besoin et taille d'équipe
- Présente les fonctionnalités pertinentes selon le cas d'usage identifié
- Propose une démo ou un essai gratuit au bon moment
- Collecte l'email professionnel pour le suivi
- Si le prospect est qualifié (>10 utilisateurs), propose un appel avec un commercial\`,
    max_tokens: 2048,
    knowledge_base_id: "kb_sales_deck"
  })
});`, []);

  const techSupportExample = useMemo(() => `const agent = await fetch('https://api.luneo.app/api/v1/agents', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_API_KEY',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    name: "Support Technique",
    model: "claude-3-sonnet",
    temperature: 0.1,
    system_prompt: \`Tu es un assistant technique pour [Produit SaaS].
Règles :
- Guide l'utilisateur étape par étape pour résoudre son problème
- Demande la version du produit et le navigateur utilisé
- Propose des solutions de la base de connaissances en priorité
- Fournis des extraits de code quand c'est nécessaire
- Si le bug est confirmé, crée un ticket avec les détails collectés
- N'invente jamais de solution : si tu ne sais pas, escalade\`,
    max_tokens: 2048,
    knowledge_base_id: "kb_tech_docs"
  })
});`, []);

  const examples = useMemo(() => [
    { id: 'support', title: 'Support Client', desc: 'Agent empathique pour répondre aux questions et résoudre les problèmes. Temperature basse pour des réponses fiables.', code: customerServiceExample, tags: ['Claude 3 Sonnet', 'Temperature 0.2', 'FAQ'] },
    { id: 'ecommerce', title: 'Conseiller E-commerce', desc: 'Assistant shopping qui guide les clients vers le bon produit en posant des questions pertinentes.', code: ecommerceExample, tags: ['GPT-4', 'Temperature 0.5', 'Catalogue'] },
    { id: 'sales', title: 'Agent Commercial', desc: 'Qualifie les prospects, présente les offres et collecte les leads pour l\'équipe commerciale.', code: salesExample, tags: ['GPT-4', 'Temperature 0.6', 'Sales Deck'] },
    { id: 'techsupport', title: 'Support Technique', desc: 'Guide technique étape par étape avec diagnostic et escalade automatique.', code: techSupportExample, tags: ['Claude 3 Sonnet', 'Temperature 0.1', 'Documentation'] },
  ], [customerServiceExample, ecommerceExample, salesExample, techSupportExample]);

  return (
    <DocPageTemplate
      title="Exemples"
      description="Configurations d'agents prêtes à l'emploi pour différents cas d'usage"
      breadcrumbs={[
        { label: 'Documentation', href: '/help/documentation' },
        { label: 'Exemples', href: '/help/documentation/examples' }
      ]}
      relatedLinks={[
        { title: 'Déployer un agent', href: '/help/documentation/quickstart/first-customizer', description: 'Guide pas à pas' },
        { title: 'Configuration IA', href: '/help/documentation/ai/generation', description: 'Paramètres des modèles' }
      ]}
    >
      {examples.map((ex) => (
        <section key={ex.id} className="mb-10">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-2xl font-bold text-white">{ex.title}</h2>
            <button
              onClick={() => copyCode(ex.code, ex.id)}
              className="p-2 bg-white/[0.04] hover:bg-white/[0.08] rounded-lg border border-white/[0.06]"
            >
              {copied === ex.id ? (
                <CheckCircle className="w-4 h-4 text-green-400" />
              ) : (
                <Copy className="w-4 h-4 text-white/40" />
              )}
            </button>
          </div>
          <p className="text-white/50 text-sm mb-3">{ex.desc}</p>
          <div className="flex gap-2 mb-4 flex-wrap">
            {ex.tags.map((tag) => (
              <span key={tag} className="text-xs px-2 py-1 bg-white/[0.06] text-white/50 rounded-full">{tag}</span>
            ))}
          </div>
          <div className="bg-black/40 rounded-lg p-4">
            <pre className="text-sm text-white/70 overflow-x-auto">
              <code>{ex.code}</code>
            </pre>
          </div>
        </section>
      ))}

      <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-6">
        <h3 className="text-xl font-bold text-white mb-3">Conseils pour vos system prompts</h3>
        <ul className="space-y-2 text-sm text-white/60">
          <li>• Définissez le rôle précis de l'agent dès la première ligne</li>
          <li>• Listez les règles de comportement sous forme de points clairs</li>
          <li>• Précisez les limites : ce que l'agent ne doit pas faire</li>
          <li>• Adaptez la temperature au cas d'usage : basse (0.1-0.3) pour le technique, moyenne (0.4-0.6) pour le commercial</li>
          <li>• Connectez toujours une base de connaissances pertinente pour des réponses contextualisées</li>
        </ul>
      </div>
    </DocPageTemplate>
  );
}

const ExamplesPageMemo = memo(ExamplesPageContent);

export default function ExamplesPage() {
  return (
    <ErrorBoundary componentName="ExamplesPage">
      <ExamplesPageMemo />
    </ErrorBoundary>
  );
}
