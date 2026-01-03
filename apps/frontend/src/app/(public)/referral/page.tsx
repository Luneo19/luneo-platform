'use client';

import React, { useState, memo } from 'react';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { LazyMotionDiv as motion } from '@/lib/performance/dynamic-motion';
import {
  Gift, Users, Coins, ArrowRight, Check, Copy, Star, TrendingUp,
  Wallet, Award, Share2, Twitter, Linkedin, Mail, MessageCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import Link from 'next/link';
import { logger } from '../../../lib/logger';

const benefits = [
  {
    icon: Coins,
    title: '30% de commission',
    description: 'Sur chaque abonnement de vos filleuls pendant 12 mois',
  },
  {
    icon: Gift,
    title: '20% de réduction',
    description: 'Pour vos filleuls sur leur premier abonnement',
  },
  {
    icon: Users,
    title: 'Pas de limite',
    description: 'Parrainez autant de personnes que vous le souhaitez',
  },
  {
    icon: Wallet,
    title: 'Paiements rapides',
    description: 'Recevez vos commissions chaque mois sur votre compte',
  },
];

const tiers = [
  { min: 0, max: 4, label: 'Bronze', commission: 20, icon: '🥉' },
  { min: 5, max: 14, label: 'Argent', commission: 25, icon: '🥈' },
  { min: 15, max: 29, label: 'Or', commission: 30, icon: '🥇' },
  { min: 30, max: Infinity, label: 'Diamant', commission: 35, icon: '💎' },
];

const stats = [
  { label: 'Affiliés actifs', value: '2,847', icon: Users },
  { label: 'Commissions versées', value: '€487K', icon: Coins },
  { label: 'Commission moyenne', value: '€342/mois', icon: TrendingUp },
];

function ReferralPageContent() {
  const [email, setEmail] = useState('');
  const [copied, setCopied] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const referralCode = 'LUNEO-' + Math.random().toString(36).substring(2, 8).toUpperCase();

  const handleCopy = () => {
    navigator.clipboard.writeText(`https://luneo.app/ref/${referralCode}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/referral/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      
      if (response.ok) {
        setSubmitted(true);
      }
    } catch (error) {
      logger.error('Error joining referral program', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900/20 to-gray-900">
      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <motion
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-purple-500/20 rounded-full text-purple-300 text-sm mb-6"
          >
            <Gift className="w-4 h-4" />
            Programme de parrainage
          </motion>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl md:text-6xl font-bold text-white mb-6"
          >
            Gagnez jusqu'à <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">35%</span> de commission
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-xl text-gray-400 max-w-2xl mx-auto mb-8"
          >
            Partagez Luneo avec votre réseau et recevez des commissions récurrentes sur chaque abonnement généré.
          </motion.p>

          {/* Stats */}
          <motion
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl mx-auto mb-12"
          >
            {stats.map((stat) => (
              <Card key={stat.label} className="p-6 bg-gray-800/50 border-gray-700">
                <stat.icon className="w-6 h-6 text-purple-400 mx-auto mb-2" />
                <p className="text-2xl font-bold text-white">{stat.value}</p>
                <p className="text-sm text-gray-400">{stat.label}</p>
              </Card>
            ))}
          </motion>

          {/* CTA Form */}
          <motion
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="max-w-md mx-auto"
          >
            {submitted ? (
              <Card className="p-6 bg-green-500/20 border-green-500/50">
                <Check className="w-8 h-8 text-green-400 mx-auto mb-3" />
                <p className="text-green-300">Demande envoyée ! Nous vous contacterons sous 24h.</p>
              </Card>
            ) : (
              <form onSubmit={handleJoin} className="flex gap-2">
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Votre email professionnel"
                  className="flex-1 bg-gray-800/50 border-gray-600 text-white"
                  required
                />
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500"
                >
                  {isSubmitting ? '...' : 'Rejoindre'}
                </Button>
              </form>
            )}
          </motion>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-20 px-4 bg-gray-900/50">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-white text-center mb-12">
            Pourquoi devenir affilié ?
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {benefits.map((benefit, index) => (
              <motion
                key={benefit.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="p-6 bg-gray-800/50 border-gray-700 h-full">
                  <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center mb-4">
                    <benefit.icon className="w-6 h-6 text-purple-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2">{benefit.title}</h3>
                  <p className="text-gray-400 text-sm">{benefit.description}</p>
                </Card>
              </motion>
            ))}
          </div>
        </div>
      </section>

      {/* Commission Tiers */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-white text-center mb-4">
            Paliers de commission
          </h2>
          <p className="text-gray-400 text-center mb-12">
            Plus vous parrainez, plus vos commissions augmentent
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {tiers.map((tier, index) => (
              <motion
                key={tier.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className={`p-6 text-center ${index === 3 ? 'bg-gradient-to-b from-purple-900/50 to-gray-800/50 border-purple-500/50' : 'bg-gray-800/50 border-gray-700'}`}>
                  <span className="text-4xl mb-3 block">{tier.icon}</span>
                  <h3 className="text-xl font-bold text-white mb-1">{tier.label}</h3>
                  <p className="text-purple-400 text-3xl font-bold mb-2">{tier.commission}%</p>
                  <p className="text-sm text-gray-400">
                    {tier.min === 0 ? '0' : tier.min} - {tier.max === Infinity ? '∞' : tier.max} filleuls
                  </p>
                </Card>
              </motion>
            ))}
          </div>
        </div>
      </section>

      {/* Share Section (for logged in users preview) */}
      <section className="py-20 px-4 bg-gray-900/50">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-3xl font-bold text-white text-center mb-8">
            Partagez votre lien
          </h2>

          <Card className="p-6 bg-gray-800/50 border-gray-700">
            <p className="text-sm text-gray-400 mb-3">Votre lien de parrainage :</p>
            <div className="flex gap-2 mb-6">
              <div className="flex-1 px-4 py-3 bg-gray-900 rounded-lg text-gray-300 font-mono text-sm truncate">
                https://luneo.app/ref/{referralCode}
              </div>
              <Button
                onClick={handleCopy}
                variant="outline"
                className="border-purple-500/50 text-purple-400 hover:bg-purple-500/10"
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              </Button>
            </div>

            <p className="text-sm text-gray-400 mb-3">Partager sur :</p>
            <div className="flex gap-3">
              <Button variant="outline" size="sm" className="border-gray-600">
                <Twitter className="w-4 h-4 mr-2" /> Twitter
              </Button>
              <Button variant="outline" size="sm" className="border-gray-600">
                <Linkedin className="w-4 h-4 mr-2" /> LinkedIn
              </Button>
              <Button variant="outline" size="sm" className="border-gray-600">
                <Mail className="w-4 h-4 mr-2" /> Email
              </Button>
            </div>
          </Card>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 px-4">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold text-white text-center mb-12">
            Questions fréquentes
          </h2>

          {[
            {
              q: 'Comment sont calculées les commissions ?',
              a: 'Vous recevez un pourcentage de chaque abonnement payé par vos filleuls, pendant 12 mois après leur inscription.',
            },
            {
              q: 'Quand puis-je retirer mes gains ?',
              a: 'Les commissions sont versées le 1er de chaque mois, à partir de 50€ minimum sur votre compte.',
            },
            {
              q: 'Y a-t-il des conditions d\'éligibilité ?',
              a: 'Le programme est ouvert à tous. Vous devez simplement avoir un compte Luneo actif.',
            },
            {
              q: 'Puis-je cumuler avec d\'autres offres ?',
              a: 'Oui, le parrainage est cumulable avec toutes les promotions en cours pour vos filleuls.',
            },
          ].map((faq, index) => (
            <motion
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="mb-6"
            >
              <Card className="p-6 bg-gray-800/50 border-gray-700">
                <h3 className="text-white font-semibold mb-2">{faq.q}</h3>
                <p className="text-gray-400">{faq.a}</p>
              </Card>
            </motion>
          ))}
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <Card className="p-12 bg-gradient-to-r from-purple-900/50 to-pink-900/50 border-purple-500/30">
            <Award className="w-16 h-16 text-purple-400 mx-auto mb-6" />
            <h2 className="text-3xl font-bold text-white mb-4">
              Prêt à gagner des commissions ?
            </h2>
            <p className="text-gray-300 mb-8 max-w-xl mx-auto">
              Rejoignez notre programme d'affiliation et commencez à générer des revenus passifs dès aujourd'hui.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/register">
                <Button className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 px-8">
                  Créer un compte
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
              <Link href="/login">
                <Button variant="outline" className="border-purple-500/50">
                  Se connecter
                </Button>
              </Link>
            </div>
          </Card>
        </div>
      </section>
    </div>
  );
}

const ReferralPageMemo = memo(ReferralPageContent);

export default function ReferralPage() {
  return (
    <ErrorBoundary componentName="ReferralPage">
      <ReferralPageMemo />
    </ErrorBoundary>
  );
}
