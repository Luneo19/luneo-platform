'use client';

import React, { memo, useMemo } from 'react';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import Link from 'next/link';
import { Briefcase, MapPin, Clock } from 'lucide-react';

const jobs = [
  { title: 'Senior Frontend Engineer', location: 'Paris / Remote', type: 'Full-time' },
  { title: '3D Graphics Engineer', location: 'Remote', type: 'Full-time' },
  { title: 'Product Designer', location: 'Paris', type: 'Full-time' },
  { title: 'Customer Success Manager', location: 'Remote Europe', type: 'Full-time' },
];

function CareersPageContent() {
  const jobsMemo = useMemo(() => jobs, []);
  return (
    <div className="min-h-screen bg-white">
      <section className="bg-gradient-to-r from-purple-600 to-pink-600 text-white py-24">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <Briefcase className="w-16 h-16 mx-auto mb-6" />
          <h1 className="text-5xl font-bold mb-6">Join Luneo</h1>
          <p className="text-2xl text-purple-100 mb-8">Construisons ensemble le futur du commerce 3D/AR</p>
          <Link href="#positions" className="bg-white text-purple-600 px-8 py-3 rounded-lg font-semibold hover:bg-purple-50 inline-block">Voir les postes</Link>
        </div>
      </section>
      <section id="positions" className="max-w-5xl mx-auto px-4 py-20">
        <h2 className="text-4xl font-bold text-center mb-12">Postes Ouverts</h2>
        <div className="space-y-4">
          {jobsMemo.map((job, idx) => (
            <div key={idx} className="bg-gray-50 rounded-xl p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between flex-wrap gap-4">
                <div>
                  <h3 className="font-bold text-xl mb-2">{job.title}</h3>
                  <div className="flex items-center gap-4 text-gray-600">
                    <span className="flex items-center gap-2"><MapPin className="w-4 h-4" />{job.location}</span>
                    <span className="flex items-center gap-2"><Clock className="w-4 h-4" />{job.type}</span>
                  </div>
                </div>
                <Link href={`/careers/${idx + 1}`} className="bg-purple-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-purple-700">Apply</Link>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

const CareersPageMemo = memo(CareersPageContent);

export default function CareersPage() {
  return (
    <ErrorBoundary componentName="CareersPage">
      <CareersPageMemo />
    </ErrorBoundary>
  );
}



