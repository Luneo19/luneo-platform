'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Building, Shield, Users, Zap, ArrowRight } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function EntreprisePage() {
  const features = [
    { icon: <Shield className="w-8 h-8" />, title: 'SSO / SAML', desc: 'Single Sign-On enterprise' },
    { icon: <Users className="w-8 h-8" />, title: 'Team Management', desc: 'Rôles et permissions granulaires' },
    { icon: <Zap className="w-8 h-8" />, title: 'API Illimitée', desc: 'Aucune limite de requêtes' },
    { icon: <Building className="w-8 h-8" />, title: 'Support Dédié', desc: 'Account manager 24/7' },
  ];

  return (
    <div className="min-h-screen bg-gray-900">
      <section className="relative overflow-hidden bg-gradient-to-br from-gray-900 via-blue-900 to-indigo-900 py-20 px-4">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,black,transparent)]" />
        </div>

        <div className="relative max-w-7xl mx-auto text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-white mb-6">
              Luneo Enterprise
              <br />
              <span className="bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
                Pour les Grandes Entreprises
              </span>
            </h1>
            <p className="text-xl text-gray-300 mb-8 max-w-3xl mx-auto">
              Solutions sur-mesure, sécurité enterprise-grade, support dédié
            </p>
            <Link href="/contact">
              <Button className="bg-gradient-to-r from-blue-600 to-indigo-600 px-8 h-12 text-lg">
                Contacter notre équipe
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      <section className="py-20 px-4 bg-gray-900">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((f, i) => (
              <Card key={i} className="p-6 bg-gray-800/50 border-gray-700">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center text-white mb-4">{f.icon}</div>
                <h3 className="text-xl font-bold text-white mb-2">{f.title}</h3>
                <p className="text-gray-400">{f.desc}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
