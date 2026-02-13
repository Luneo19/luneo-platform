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
import { useI18n } from '@/i18n/useI18n';

function ContactPageContent() {
  const { t } = useI18n();

  const contactInfo = [
    {
      icon: <Mail className="w-6 h-6" />,
      title: t('public.contact.contactInfo.supportEmail'),
      details: 'support@luneo.app',
      description: t('public.contact.contactInfo.response24h'),
      color: 'blue' as const
    },
    {
      icon: <Mail className="w-6 h-6" />,
      title: t('public.contact.contactInfo.commercialEmail'),
      details: 'contact@luneo.app',
      description: t('public.contact.contactInfo.response24h'),
      color: 'green' as const
    },
    {
      icon: <MapPin className="w-6 h-6" />,
      title: t('public.contact.contactInfo.location'),
      details: 'Neuchâtel, Suisse',
      description: t('public.contact.contactInfo.mainOffice'),
      color: 'purple' as const
    }
  ];

  const faqs = [
    { question: t('public.contact.faq.q1'), answer: t('public.contact.faq.a1') },
    { question: t('public.contact.faq.q2'), answer: t('public.contact.faq.a2') },
    { question: t('public.contact.faq.q3'), answer: t('public.contact.faq.a3') }
  ];
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
          setError(t('public.contact.captchaRequired'));
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
        throw new Error(data.error || data.message || t('public.contact.error'));
      }

      setIsSubmitted(true);
      setFormData({ name: '', email: '', company: '', subject: '', message: '' });
      
      setTimeout(() => setIsSubmitted(false), 5000);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : t('common.somethingWentWrong');
      logger.error('Contact form error', { error: err, formData: { ...formData, message: '[REDACTED]' } });
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, t]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (error) setError(null);
  };

  return (
    <>
      <PageHero
        title={t('public.contact.title')}
        description={t('public.contact.description')}
        badge={t('public.contact.badge')}
        gradient="from-blue-600 via-purple-600 to-pink-600"
      />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-14 sm:py-20 md:py-24">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Form */}
          <Card className="p-5 sm:p-8 bg-dark-card/60 border-white/[0.04]">
            <h2 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6 text-white font-display">{t('public.contact.sendMessage')}</h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">{t('public.contact.name')}</label>
                  <Input
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder={t('public.contact.namePlaceholder')}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">{t('public.contact.email')}</label>
                  <Input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder={t('public.contact.emailPlaceholder')}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">{t('public.contact.companyOptional')}</label>
                <Input
                  name="company"
                  value={formData.company}
                  onChange={handleChange}
                  placeholder={t('public.contact.companyPlaceholder')}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">{t('public.contact.subject')}</label>
                <Input
                  name="subject"
                  value={formData.subject}
                  onChange={handleChange}
                  placeholder={t('public.contact.subjectPlaceholder')}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">{t('public.contact.message')}</label>
                <textarea
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  placeholder={t('public.contact.messagePlaceholderProject')}
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
                    <p className="text-sm font-medium text-green-300">{t('public.contact.successMessage')}</p>
                    <p className="text-xs text-green-400 mt-1">{t('public.contact.successDesc')}</p>
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
                    {t('public.contact.sending')}
                  </span>
                ) : isSubmitted ? (
                  <span className="flex items-center justify-center">
                    <CheckCircle className="w-5 h-5 mr-2" />
                    {t('public.contact.success')}
                  </span>
                ) : (
                  <span className="flex items-center justify-center">
                    <Send className="w-5 h-5 mr-2" />
                    {t('public.contact.sendMessage')}
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
                {t('public.contact.faqTitle')}
              </h3>
              <div className="space-y-3">
                {faqs.map((faq, i) => (
                  <details key={i} className="group">
                    <summary className="cursor-pointer text-sm font-medium text-slate-300 hover:text-purple-400 transition-colors">
                      {faq.question}
                    </summary>
                    <p className="mt-2 text-xs text-slate-300 pl-4">{faq.answer}</p>
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
