'use client';

import React, { useState, useCallback, memo } from 'react';
import { Mail, Phone, MapPin, Send, CheckCircle, MessageSquare, Loader2, AlertCircle } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { api } from '@/lib/api/client';
import { logger } from '@/lib/logger';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { PageHero, SectionHeader, FeatureCard } from '@/components/marketing/shared';

const contactInfo = [
  {
    icon: <Mail className="w-6 h-6" />,
    title: 'Email',
    details: 'contact@luneo.app',
    description: 'Réponse sous 24h',
    color: 'blue' as const
  },
  {
    icon: <Phone className="w-6 h-6" />,
    title: 'Téléphone',
    details: '+33 1 23 45 67 89',
    description: 'Lun-Ven 9h-18h',
    color: 'green' as const
  },
  {
    icon: <MapPin className="w-6 h-6" />,
    title: 'Adresse',
    details: 'Paris, France',
    description: 'Bureau principal',
    color: 'purple' as const
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

function ContactPageContent() {
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
      // ✅ CAPTCHA verification
      let captchaToken = '';
      try {
        const { executeRecaptcha } = await import('@/lib/captcha/recaptcha');
        captchaToken = await executeRecaptcha('contact');
      } catch (captchaError) {
        // In development, continue without CAPTCHA if not configured
        if (process.env.NODE_ENV === 'production') {
          setError('Vérification CAPTCHA requise. Veuillez réessayer.');
          setIsSubmitting(false);
          return;
        }
      }

      const data = await api.post<{ success?: boolean; error?: string; message?: string }>('/api/v1/contact', {
        ...formData,
        type: 'general',
        captchaToken,
      });

      if (!data.success) {
        throw new Error(data.error || data.message || 'Erreur lors de l\'envoi');
      }

      setIsSubmitted(true);
      setFormData({ name: '', email: '', company: '', subject: '', message: '' });
      
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
    if (error) setError(null);
  };

  return (
    <>
      <PageHero
        title="Contactez-nous"
        description="Nous sommes là pour vous aider. N'hésitez pas à nous contacter pour toute question ou pour discuter de vos besoins en design."
        badge="Contact"
        gradient="from-blue-600 via-purple-600 to-pink-600"
      />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-14 sm:py-20 md:py-24">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Form */}
          <Card className="p-5 sm:p-8 bg-dark-card/60 border-white/[0.04]">
            <h2 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6 text-white font-display">Envoyez-nous un message</h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Nom</label>
                  <Input
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Votre nom"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Email</label>
                  <Input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="votre@email.com"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Entreprise (optionnel)</label>
                <Input
                  name="company"
                  value={formData.company}
                  onChange={handleChange}
                  placeholder="Nom de votre entreprise"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Sujet</label>
                <Input
                  name="subject"
                  value={formData.subject}
                  onChange={handleChange}
                  placeholder="Sujet de votre message"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Message</label>
                <textarea
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  placeholder="Décrivez votre projet ou votre question..."
                  rows={6}
                  required
                  className="w-full px-3 py-2 border border-dark-border bg-dark-surface text-white placeholder:text-slate-600 rounded-lg focus:border-purple-500/50 focus:outline-none focus:ring-1 focus:ring-purple-500/20 resize-none"
                />
              </div>

              {error && (
                <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-400">{error}</p>
                </div>
              )}

              {isSubmitted && (
                <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-green-300">Message envoye avec succes !</p>
                    <p className="text-xs text-green-400 mt-1">Nous vous repondrons sous 24h.</p>
                  </div>
                </div>
              )}

              <Button
                type="submit"
                disabled={isSubmitting || isSubmitted}
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold h-12 shadow-lg shadow-purple-500/25 disabled:opacity-50 transition-all duration-200"
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

          {/* Contact Info */}
          <div className="space-y-4 sm:space-y-6">
            {contactInfo.map((info, i) => (
              <FeatureCard
                key={info.title}
                icon={info.icon}
                title={info.title}
                description={`${info.details} - ${info.description}`}
                color={info.color}
                staggerIndex={i}
              />
            ))}

            {/* FAQ Card */}
            <Card className="p-6 bg-gradient-to-br from-purple-500/10 to-pink-500/10 border-white/[0.04]">
              <h3 className="font-bold mb-4 flex items-center text-white">
                <MessageSquare className="w-5 h-5 mr-2" />
                Questions fréquentes
              </h3>
              <div className="space-y-3">
                {faqs.map((faq, i) => (
                  <details key={i} className="group">
                    <summary className="cursor-pointer text-sm font-medium text-slate-300 hover:text-purple-400 transition-colors">
                      {faq.question}
                    </summary>
                    <p className="mt-2 text-xs text-slate-500 pl-4">{faq.answer}</p>
                  </details>
                ))}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
}

const MemoizedContactPageContent = memo(ContactPageContent);

export default function ContactPage() {
  return (
    <ErrorBoundary level="page" componentName="ContactPage">
      <MemoizedContactPageContent />
    </ErrorBoundary>
  );
}
