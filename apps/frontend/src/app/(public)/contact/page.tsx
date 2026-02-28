'use client';

import React, { useState, useCallback, memo, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Mail, MapPin, Send, CheckCircle, MessageSquare, Loader2, AlertCircle, Building2, TicketIcon } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { logger } from '@/lib/logger';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { PageHero, FeatureCard } from '@/components/marketing/shared';
import { useI18n } from '@/i18n/useI18n';
import { SUPPORT_CONFIG } from '@/lib/support-config';

/** Get CSRF token from cookie or fetch from API (cookie is httpOnly in prod). */
async function getCSRFTokenForRequest(): Promise<string | null> {
  if (typeof document === 'undefined') return null;
  const fromCookie = document.cookie
    .split('; ')
    .find(row => row.startsWith('csrf_token='))
    ?.split('=')[1];
  if (fromCookie) return decodeURIComponent(fromCookie);
  try {
    const res = await fetch('/api/csrf/token', { credentials: 'include' });
    const data = await res.json();
    return data?.token ?? null;
  } catch {
    return null;
  }
}

function ContactPageContentInner() {
  const { t } = useI18n();
  const searchParams = useSearchParams();
  const planParam = searchParams.get('plan');
  const sourceParam = searchParams.get('source');
  const isEnterprisePricing = planParam === 'enterprise' && sourceParam === 'pricing';

  const contactInfo = [
    {
      icon: <Mail className="w-6 h-6" />,
      title: t('public.contact.contactInfo.primaryEmail'),
      details: SUPPORT_CONFIG.email,
      description: t('public.contact.contactInfo.response24h'),
      color: 'blue' as const
    },
    {
      icon: <TicketIcon className="w-6 h-6" />,
      title: t('public.contact.contactInfo.supportPortal'),
      details: `luneo.app${SUPPORT_CONFIG.supportPortalPath}`,
      description: t('public.contact.contactInfo.supportPortalDesc'),
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
    subject: isEnterprisePricing ? t('public.contact.enterprise.prefillSubject') : '',
    message: isEnterprisePricing
      ? t('public.contact.enterprise.prefillMessage')
      : '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isEnterprisePricing && !formData.subject.includes('Enterprise')) {
      setFormData(prev => ({
        ...prev,
        subject: t('public.contact.enterprise.prefillSubject'),
        message: prev.message || t('public.contact.enterprise.prefillMessage'),
      }));
    }
  }, [isEnterprisePricing, formData.subject, t]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      // reCAPTCHA when site key is available
      let captchaToken = '';
      const siteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;
      if (siteKey) {
        try {
          const { executeRecaptcha } = await import('@/lib/captcha/recaptcha');
          captchaToken = await executeRecaptcha('contact');
        } catch (captchaError) {
          if (process.env.NODE_ENV === 'production') {
            setError(t('public.contact.captchaRequired'));
            setIsSubmitting(false);
            return;
          }
        }
      }

      const csrfToken = await getCSRFTokenForRequest();
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (csrfToken) {
        headers['X-CSRF-Token'] = csrfToken;
      }

      const res = await fetch('/api/contact', {
        method: 'POST',
        credentials: 'include',
        headers,
        body: JSON.stringify({
          ...formData,
          type: isEnterprisePricing ? 'enterprise_pricing' : 'general',
          plan: planParam || undefined,
          source: sourceParam || undefined,
          captchaToken: captchaToken || undefined,
        }),
      });

      const data = await res.json().catch(() => ({}));
      const success = res.ok && data?.success !== false;

      if (!success) {
        const msg = data?.error ?? data?.message ?? t('public.contact.error');
        throw new Error(typeof msg === 'string' ? msg : t('public.contact.error'));
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
  }, [formData, isEnterprisePricing, planParam, sourceParam, t]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (error) setError(null);
  };

  return (
    <>
      <PageHero
        title={t('public.contact.title')}
        description={t('public.contact.description')}
        gradient="from-blue-700 via-blue-600 to-indigo-600"
      />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-14 sm:py-20 md:py-24">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Form */}
          <Card className="p-5 sm:p-8 bg-dark-card/60 border-white/[0.04]">
            {isEnterprisePricing && (
              <div className="mb-6 p-4 rounded-xl bg-blue-500/10 border border-blue-500/20">
                <div className="flex items-start gap-3">
                  <Building2 className="w-5 h-5 text-indigo-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="text-sm font-semibold text-indigo-300">Plan Enterprise — Demande de devis</h3>
                    <p className="text-xs text-white/50 mt-1">
                      {t('public.contact.enterprise.bannerDescription')}
                    </p>
                  </div>
                </div>
              </div>
            )}
            <h2 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6 text-white font-display">
              {isEnterprisePricing ? t('public.contact.enterprise.bannerTitle') : t('public.contact.sendMessage')}
            </h2>
            
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
                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold h-12 shadow-lg shadow-blue-500/20 disabled:opacity-50 transition-all duration-200"
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
            {contactInfo.map((info) => (
              <FeatureCard
                key={info.title}
                icon={info.icon}
                title={info.title}
                description={`${info.details} - ${info.description}`}
              />
            ))}

            {/* Gestion des tickets */}
            <Card className="p-6 bg-dark-card/60 border-white/[0.04]">
              <h3 className="font-bold mb-2 flex items-center text-white">
                <TicketIcon className="w-5 h-5 mr-2" />
                {t('public.contact.supportCard.title')}
              </h3>
              <p className="text-sm text-slate-400 mb-4">
                {t('public.contact.supportCard.description')}
              </p>
              <Button asChild variant="outline" className="w-full border-white/10 text-slate-300 hover:bg-white/5 hover:text-white">
                <Link href={SUPPORT_CONFIG.supportPortalPath}>{t('public.contact.supportCard.cta')}</Link>
              </Button>
            </Card>

            {/* FAQ Card */}
            <Card className="p-6 bg-blue-500/10 border-white/[0.04]">
              <h3 className="font-bold mb-4 flex items-center text-white">
                <MessageSquare className="w-5 h-5 mr-2" />
                {t('public.contact.faqTitle')}
              </h3>
              <div className="space-y-3">
                {faqs.map((faq, i) => (
                  <details key={i} className="group">
                    <summary className="cursor-pointer text-sm font-medium text-slate-300 hover:text-blue-400 transition-colors">
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

const MemoizedContactPageContentInner = memo(ContactPageContentInner);

function ContactPageContent() {
  return (
    <Suspense fallback={
      <div className="container mx-auto px-4 py-14 sm:py-20">
        <div className="h-12 w-48 bg-white/5 rounded-lg animate-pulse" aria-hidden />
      </div>
    }>
      <MemoizedContactPageContentInner />
    </Suspense>
  );
}

export default function ContactPage() {
  return (
    <ErrorBoundary level="page" componentName="ContactPage">
      <ContactPageContent />
    </ErrorBoundary>
  );
}
