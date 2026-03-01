'use client';

import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const VERTICALS = [
  { slug: 'ecommerce', title: 'E-commerce', description: 'Support commande, retours, conversion.' },
  { slug: 'real-estate', title: 'Immobilier', description: 'Qualification leads et prise de visite.' },
  { slug: 'medical', title: 'Medical', description: 'Orientation patient et prise de rendez-vous.' },
  { slug: 'accounting', title: 'Comptabilite', description: 'Qualification dossiers et support fiscal.' },
  { slug: 'recruitment', title: 'Recrutement', description: 'Pre-qualification candidats.' },
  { slug: 'restaurant', title: 'Restaurant', description: 'Reservations et gestion relation client.' },
  { slug: 'education', title: 'Education', description: 'Admissions et orientation apprenants.' },
];

export default function OnboardingVerticalPage() {
  return (
    <main className="min-h-screen bg-[#0a0a0f] text-white p-6">
      <div className="max-w-5xl mx-auto space-y-6">
        <header className="space-y-2">
          <h1 className="text-3xl font-semibold">Choisir une verticale</h1>
          <p className="text-white/60">
            Selectionnez votre secteur pour preconfigurer intents, workflows et KPI.
          </p>
        </header>

        <section className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {VERTICALS.map((vertical) => (
            <Card key={vertical.slug} className="bg-white/[0.03] border-white/[0.08] p-5">
              <h2 className="font-medium mb-2">{vertical.title}</h2>
              <p className="text-sm text-white/60 mb-4">{vertical.description}</p>
              <Button asChild className="w-full">
                <Link href={`/onboarding?vertical=${vertical.slug}`}>Utiliser ce template</Link>
              </Button>
            </Card>
          ))}
        </section>
      </div>
    </main>
  );
}
