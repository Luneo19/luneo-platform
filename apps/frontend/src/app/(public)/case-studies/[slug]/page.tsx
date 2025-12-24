'use client';

import React, { memo } from 'react';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import Link from 'next/link';
import { ArrowLeft, Award, TrendingUp, Users, Zap, CheckCircle } from 'lucide-react';
import { useParams } from 'next/navigation';
import Image from 'next/image';

// Données des case studies (en production, viendrait d'une API ou CMS)
const caseStudies: Record<string, {
  slug: string;
  company: string;
  industry: string;
  challenge: string;
  solution: string[];
  results: Array<{ metric: string; value: string; description: string }>;
  testimonial?: { author: string; role: string; quote: string };
  image?: string;
}> = {
  '1': {
    slug: '1',
    company: 'Fashion Brand X',
    industry: 'Mode & Retail',
    challenge: 'Taux de conversion faible sur les produits personnalisés, difficulté à visualiser les designs avant achat.',
    solution: [
      'Intégration Virtual Try-On avec MediaPipe',
      'Configurateur 3D pour visualisation produits',
      'AI Design Hub pour génération automatique de variantes',
    ],
    results: [
      { metric: 'Conversion', value: '+45%', description: 'Augmentation du taux de conversion' },
      { metric: 'Temps', value: '-60%', description: 'Réduction du temps de personnalisation' },
      { metric: 'Satisfaction', value: '4.8/5', description: 'Note moyenne client' },
    ],
    testimonial: {
      author: 'Marie Dupont',
      role: 'Directrice E-commerce',
      quote: 'Luneo a transformé notre façon de vendre. Les clients peuvent maintenant essayer virtuellement nos produits avant d\'acheter.',
    },
  },
  '2': {
    slug: '2',
    company: 'Print Company Y',
    industry: 'Impression & POD',
    challenge: 'Processus de création manuel chronophage, erreurs fréquentes, délais de livraison longs.',
    solution: [
      'Automatisation complète avec AI Design Hub',
      'Intégration API pour commandes en masse',
      'Export print-ready automatique (CMYK, 300 DPI)',
    ],
    results: [
      { metric: 'Automatisation', value: '90%', description: 'Designs générés automatiquement' },
      { metric: 'Erreurs', value: '-85%', description: 'Réduction des erreurs de production' },
      { metric: 'Délais', value: '-70%', description: 'Réduction des délais de livraison' },
    ],
    testimonial: {
      author: 'Jean Martin',
      role: 'CEO',
      quote: 'Nous produisons maintenant 10x plus de designs avec la même équipe. L\'automatisation est impressionnante.',
    },
  },
  '3': {
    slug: '3',
    company: 'E-commerce Z',
    industry: 'E-commerce',
    challenge: 'Besoin de personnaliser des millions de produits, infrastructure limitée, coûts élevés.',
    solution: [
      'SDK React intégré dans le site',
      'Configurateur 3D embarqué',
      'CDN optimisé pour assets 3D',
      'Webhooks pour synchronisation temps réel',
    ],
    results: [
      { metric: 'Produits', value: '1M+/mois', description: 'Produits personnalisés par mois' },
      { metric: 'Performance', value: '<2s', description: 'Temps de chargement moyen' },
      { metric: 'Coûts', value: '-40%', description: 'Réduction des coûts infrastructure' },
    ],
  },
  '4': {
    slug: '4',
    company: 'Agency A',
    industry: 'Agence Marketing',
    challenge: 'Clients demandent des designs personnalisés rapidement, équipe surchargée, marges faibles.',
    solution: [
      'AI Design Hub pour génération rapide',
      'Templates réutilisables et personnalisables',
      'Workflow automatisé avec CLI',
      'Dashboard analytics pour suivi projets',
    ],
    results: [
      { metric: 'Temps', value: '-80%', description: 'Réduction du temps de production' },
      { metric: 'Capacité', value: '+300%', description: 'Augmentation de la capacité' },
      { metric: 'Marges', value: '+25%', description: 'Amélioration des marges' },
    ],
    testimonial: {
      author: 'Sophie Bernard',
      role: 'Directrice Créative',
      quote: 'Nous pouvons maintenant gérer 3x plus de clients avec la même équipe. L\'IA fait le travail répétitif.',
    },
  },
};

function CaseStudyDetailContent() {
  const params = useParams();
  const slug = params.slug as string;
  const caseStudy = caseStudies[slug];

  if (!caseStudy) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Case Study non trouvé</h1>
          <p className="text-gray-600 mb-8">Le cas d'étude demandé n'existe pas.</p>
          <Link href="/case-studies">
            <button className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors">
              Retour aux case studies
            </button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <section className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-20">
        <div className="max-w-7xl mx-auto px-4">
          <Link
            href="/case-studies"
            className="inline-flex items-center gap-2 text-indigo-100 hover:text-white mb-8 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Retour aux case studies
          </Link>
          <div className="flex items-center gap-3 mb-4">
            <Award className="w-12 h-12" />
            <span className="text-indigo-200 text-sm font-semibold uppercase tracking-wide">{caseStudy.industry}</span>
          </div>
          <h1 className="text-5xl font-bold mb-4">{caseStudy.company}</h1>
          <p className="text-xl text-indigo-100 max-w-3xl">{caseStudy.challenge}</p>
        </div>
      </section>

      {/* Challenge & Solution */}
      <section className="max-w-7xl mx-auto px-4 py-16">
        <div className="grid md:grid-cols-2 gap-12 mb-16">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 mb-6 flex items-center gap-3">
              <Zap className="w-8 h-8 text-yellow-500" />
              Le Défi
            </h2>
            <p className="text-lg text-gray-700 leading-relaxed">{caseStudy.challenge}</p>
          </div>
          <div>
            <h2 className="text-3xl font-bold text-gray-900 mb-6 flex items-center gap-3">
              <CheckCircle className="w-8 h-8 text-green-500" />
              La Solution
            </h2>
            <ul className="space-y-4">
              {caseStudy.solution.map((item, idx) => (
                <li key={idx} className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-500 mt-1 flex-shrink-0" />
                  <span className="text-gray-700">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Results */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 flex items-center gap-3">
            <TrendingUp className="w-8 h-8 text-blue-500" />
            Résultats
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            {caseStudy.results.map((result, idx) => (
              <div key={idx} className="text-center">
                <div className="text-5xl font-bold text-blue-600 mb-2">{result.value}</div>
                <div className="text-lg font-semibold text-gray-900 mb-1">{result.metric}</div>
                <div className="text-sm text-gray-600">{result.description}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Testimonial */}
        {caseStudy.testimonial && (
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-8 mb-16">
            <div className="max-w-3xl mx-auto">
              <div className="flex items-center gap-2 mb-4">
                <Users className="w-6 h-6 text-blue-600" />
                <span className="text-sm font-semibold text-blue-600 uppercase tracking-wide">Témoignage</span>
              </div>
              <blockquote className="text-2xl font-semibold text-gray-900 mb-6 leading-relaxed">
                "{caseStudy.testimonial.quote}"
              </blockquote>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold">
                  {caseStudy.testimonial.author.split(' ').map(n => n[0]).join('')}
                </div>
                <div>
                  <div className="font-semibold text-gray-900">{caseStudy.testimonial.author}</div>
                  <div className="text-sm text-gray-600">{caseStudy.testimonial.role}</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* CTA */}
        <div className="text-center">
          <h3 className="text-2xl font-bold text-gray-900 mb-4">Prêt à obtenir des résultats similaires ?</h3>
          <p className="text-gray-600 mb-8">Rejoignez des centaines d'entreprises qui font confiance à Luneo</p>
          <div className="flex gap-4 justify-center">
            <Link href="/register">
              <button className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 transition-colors font-semibold">
                Commencer gratuitement
              </button>
            </Link>
            <Link href="/contact">
              <button className="bg-white text-blue-600 border-2 border-blue-600 px-8 py-3 rounded-lg hover:bg-blue-50 transition-colors font-semibold">
                Nous contacter
              </button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

const CaseStudyDetailMemo = memo(CaseStudyDetailContent);

export default function CaseStudyDetailPage() {
  return (
    <ErrorBoundary level="page" componentName="CaseStudyDetailPage">
      <CaseStudyDetailMemo />
    </ErrorBoundary>
  );
}






















