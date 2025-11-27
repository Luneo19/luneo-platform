'use client';

import React, { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Mail, Phone, MapPin, Send, CheckCircle, ArrowLeft, MessageSquare, Loader2, AlertCircle } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Link from 'next/link';
import { logger } from '@/lib/logger';

const contactInfo = [
  {
    icon: <Mail className="h-6 w-6 text-blue-400" />,
    title: 'Email',
    details: 'contact@luneo.app',
    description: 'Réponse sous 24h'
  },
  {
    icon: <Phone className="h-6 w-6 text-green-400" />,
    title: 'Téléphone',
    details: '+33 1 23 45 67 89',
    description: 'Lun-Ven 9h-18h'
  },
  {
    icon: <MapPin className="h-6 w-6 text-purple-400" />,
    title: 'Adresse',
    details: 'Paris, France',
    description: 'Bureau principal'
  }
];

const faqs = [
  {
    question: 'Comment puis-je commencer avec Luneo ?',
    answer: 'Créez simplement un compte gratuit sur notre plateforme et commencez à créer vos premiers designs en quelques minutes.'
  },
  {
    question: 'Quels types de designs puis-je créer ?',
    answer: 'Vous pouvez créer des logos, bannières, cartes de visite, posts pour réseaux sociaux, et bien plus encore.'
  },
  {
    question: 'Y a-t-il une limite sur le plan gratuit ?',
    answer: 'Le plan gratuit vous permet de créer 10 designs par mois avec accès aux templates de base.'
  }
];

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
    subject: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          type: 'general',
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || data.message || 'Erreur lors de l\'envoi');
      }

      setIsSubmitted(true);
      setFormData({ name: '', email: '', company: '', subject: '', message: '' });
      
      // Reset success message after 5 seconds
      setTimeout(() => setIsSubmitted(false), 5000);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Une erreur est survenue';
      logger.error('Contact form error', { error: err, formData: { ...formData, message: '[REDACTED]' } });
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  }, [formData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (error) setError(null); // Clear error on input change
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Hero Section */}
      <section className="relative overflow-hidden py-12 sm:py-16 md:py-20 lg:py-24">
        <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-black to-blue-900/50">
          <div className="absolute inset-0 opacity-20">
            <div className="grid grid-cols-8 sm:grid-cols-12 grid-rows-6 h-full w-full">
              {Array.from({ length: 72 }).map((_, i) => (
                <div
                  key={i}
                  className="border border-blue-500/20 animate-pulse"
                  style={{
                    animationDelay: `${(i * 0.1) % 3}s`,
                    animationDuration: '3s'
                  }}
                />
              ))}
            </div>
          </div>
        </div>

        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 md:px-8 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <div className="flex justify-start mb-6 md:mb-8">
              <Link href="/">
                <Button variant="outline" className="border-gray-600 text-gray-300 hover:bg-gray-700 flex items-center backdrop-blur-sm">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Retour à l'accueil
                </Button>
              </Link>
            </div>

            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-4 md:mb-6">
              <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                Contactez-nous
              </span>
            </h1>
            <p className="text-base sm:text-lg md:text-xl text-gray-300 mb-6 md:mb-8 max-w-3xl mx-auto">
              Nous sommes là pour vous aider. N'hésitez pas à nous contacter pour toute question ou pour discuter de vos besoins en design.
            </p>
          </motion.div>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 md:px-8 pb-12 sm:pb-16 md:pb-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
          {/* Form */}
          <motion.div initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6 }}>
            <Card className="p-6 sm:p-8 bg-gray-800/50 backdrop-blur-sm border-gray-700">
              <h2 className="text-2xl font-bold text-white mb-6">Envoyez-nous un message</h2>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Nom</label>
                    <Input
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="Votre nom"
                      required
                      className="bg-gray-900 border-gray-600 text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Email</label>
                    <Input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="votre@email.com"
                      required
                      className="bg-gray-900 border-gray-600 text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Entreprise (optionnel)</label>
                  <Input
                    name="company"
                    value={formData.company}
                    onChange={handleChange}
                    placeholder="Nom de votre entreprise"
                    className="bg-gray-900 border-gray-600 text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Sujet</label>
                  <Input
                    name="subject"
                    value={formData.subject}
                    onChange={handleChange}
                    placeholder="Sujet de votre message"
                    required
                    className="bg-gray-900 border-gray-600 text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Message</label>
                  <textarea
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    placeholder="Décrivez votre projet ou votre question..."
                    rows={6}
                    required
                    className="w-full px-3 py-2 bg-gray-900 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:border-blue-400 focus:outline-none resize-none"
                  />
                </div>

                {/* Error message */}
                {error && (
                  <div className="p-4 bg-red-900/30 border border-red-500/50 rounded-lg flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-red-300">{error}</p>
                  </div>
                )}

                {/* Success message */}
                {isSubmitted && (
                  <div className="p-4 bg-green-900/30 border border-green-500/50 rounded-lg flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-green-300">Message envoyé avec succès !</p>
                      <p className="text-xs text-green-400/70 mt-1">Nous vous répondrons sous 24h.</p>
                    </div>
                  </div>
                )}

                <Button
                  type="submit"
                  disabled={isSubmitting || isSubmitted}
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold h-12 disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <span className="flex items-center justify-center">
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Envoi en cours...
                    </span>
                  ) : isSubmitted ? (
                    <span className="flex items-center justify-center">
                      <CheckCircle className="w-5 h-5 mr-2" />
                      Message envoyé !
                    </span>
                  ) : (
                    <span className="flex items-center justify-center">
                      <Send className="w-5 h-5 mr-2" />
                      Envoyer le message
                    </span>
                  )}
                </Button>
              </form>
            </Card>
          </motion.div>

          {/* Contact Info */}
          <motion.div initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6, delay: 0.2 }}>
            <div className="space-y-6">
              {contactInfo.map((info, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 + i * 0.1 }}
                >
                  <Card className="p-6 bg-gray-800/50 backdrop-blur-sm border-gray-700 hover:bg-gray-800/70 transition-all">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                        {info.icon}
                      </div>
                      <div>
                        <h3 className="font-semibold text-white mb-1">{info.title}</h3>
                        <p className="text-sm text-blue-400 mb-1">{info.details}</p>
                        <p className="text-xs text-gray-400">{info.description}</p>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              ))}

              {/* FAQ Card */}
              <Card className="p-6 bg-gradient-to-br from-blue-900/20 to-purple-900/20 border-blue-400/30">
                <h3 className="font-bold text-white mb-4 flex items-center">
                  <MessageSquare className="w-5 h-5 mr-2" />
                  Questions fréquentes
                </h3>
                <div className="space-y-3">
                  {faqs.map((faq, i) => (
                    <details key={i} className="group">
                      <summary className="cursor-pointer text-sm font-medium text-gray-300 hover:text-white transition-colors">
                        {faq.question}
                      </summary>
                      <p className="mt-2 text-xs text-gray-400 pl-4">{faq.answer}</p>
                    </details>
                  ))}
                </div>
              </Card>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
