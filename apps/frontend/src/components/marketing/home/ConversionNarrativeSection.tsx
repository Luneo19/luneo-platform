'use client';

import Link from 'next/link';
import { useI18n } from '@/i18n/useI18n';
import { ArrowRight, CheckCircle2, Clock3, Wallet, TrendingUp } from 'lucide-react';

export function ConversionNarrativeSection() {
  const { locale } = useI18n();
  const isEn = locale === 'en';

  const pains = isEn
    ? [
        'Your team repeats the same answers all day.',
        'Response delays hurt satisfaction and sales.',
        'Knowledge is fragmented across tools and people.',
      ]
    : [
        'Votre équipe répète les mêmes réponses toute la journée.',
        'Les délais de réponse dégradent la satisfaction et les ventes.',
        'La connaissance est dispersée entre outils et personnes.',
      ];

  const steps = isEn
    ? [
        'Connect your docs, FAQ, CRM and channels.',
        'Train AI agents on your real business context.',
        'Deploy in production with monitoring and guardrails.',
      ]
    : [
        'Connectez vos docs, FAQ, CRM et canaux.',
        'Entraînez vos agents IA sur votre contexte métier réel.',
        'Déployez en production avec monitoring et garde-fous.',
      ];

  const faq = isEn
    ? [
        {
          q: 'How long before we see value?',
          a: 'Most teams ship their first production agent in less than 2 weeks.',
        },
        {
          q: 'Can we keep human validation?',
          a: 'Yes. You decide confidence thresholds and escalation to your team.',
        },
        {
          q: 'Is enterprise security included?',
          a: 'Yes: role-based access, auditability and production-ready controls.',
        },
      ]
    : [
        {
          q: 'En combien de temps voit-on de la valeur ?',
          a: 'La plupart des équipes déploient un premier agent en production en moins de 2 semaines.',
        },
        {
          q: 'Peut-on garder une validation humaine ?',
          a: 'Oui. Vous définissez les seuils de confiance et l’escalade vers vos équipes.',
        },
        {
          q: 'La sécurité enterprise est-elle incluse ?',
          a: 'Oui : contrôle d’accès par rôle, auditabilité et garde-fous prêts pour la prod.',
        },
      ];

  return (
    <>
      <section className="relative py-20 sm:py-24">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-6 sm:p-8">
              <h3 className="text-2xl font-bold text-white mb-4">
                {isEn ? 'Real customer pain points' : 'Les vrais points de douleur client'}
              </h3>
              <ul className="space-y-3">
                {pains.map((item) => (
                  <li key={item} className="flex items-start gap-2 text-white/70">
                    <CheckCircle2 className="w-4 h-4 mt-1 text-cyan-400" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-6 sm:p-8">
              <h3 className="text-2xl font-bold text-white mb-4">
                {isEn ? 'How Luneo solves them' : 'Comment Luneo les résout'}
              </h3>
              <ul className="space-y-3">
                {steps.map((item, idx) => (
                  <li key={item} className="flex items-start gap-3 text-white/70">
                    <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-indigo-500/20 text-xs text-indigo-300">
                      {idx + 1}
                    </span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section className="relative py-20 sm:py-24">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <h3 className="text-center text-3xl sm:text-4xl font-bold text-white mb-10">
            {isEn ? 'Concrete ROI you can present to leadership' : 'Un ROI concret à présenter à votre direction'}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-6">
              <Clock3 className="w-5 h-5 text-cyan-400 mb-3" />
              <p className="text-3xl font-bold text-white mb-1">-45%</p>
              <p className="text-white/60 text-sm">
                {isEn ? 'Average reduction in first response time' : 'Réduction moyenne du temps de première réponse'}
              </p>
            </div>
            <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-6">
              <Wallet className="w-5 h-5 text-emerald-400 mb-3" />
              <p className="text-3xl font-bold text-white mb-1">-30%</p>
              <p className="text-white/60 text-sm">
                {isEn ? 'Operational cost savings on repetitive requests' : 'Économie sur les coûts opérationnels des demandes répétitives'}
              </p>
            </div>
            <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-6">
              <TrendingUp className="w-5 h-5 text-violet-400 mb-3" />
              <p className="text-3xl font-bold text-white mb-1">+22%</p>
              <p className="text-white/60 text-sm">
                {isEn ? 'Increase in conversion after instant assistance' : "Hausse de conversion grâce à l'assistance instantanée"}
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="relative py-20 sm:py-24">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <h3 className="text-center text-3xl sm:text-4xl font-bold text-white mb-10">
            {isEn ? 'FAQ before go-live' : 'FAQ avant mise en production'}
          </h3>
          <div className="space-y-3">
            {faq.map((item) => (
              <details key={item.q} className="rounded-xl border border-white/[0.08] bg-white/[0.03] p-5">
                <summary className="cursor-pointer text-white font-medium">{item.q}</summary>
                <p className="text-white/60 mt-2 text-sm">{item.a}</p>
              </details>
            ))}
          </div>
          <div className="text-center mt-10">
            <Link
              href="/contact?plan=enterprise&source=home"
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-600 px-6 py-3 text-white font-semibold"
            >
              {isEn ? 'Book my AI roadmap session' : 'Planifier ma session roadmap IA'}
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
