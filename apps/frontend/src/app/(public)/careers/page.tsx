'use client';

import React, { memo, useState, useRef } from 'react';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import Link from 'next/link';
import { Briefcase, Send, FileUp, CheckCircle, AlertCircle } from 'lucide-react';
import { useI18n } from '@/i18n/useI18n';

type SubmitStatus = 'idle' | 'loading' | 'success' | 'error';

function CareersPageContent() {
  const { locale } = useI18n();
  const isEn = locale === 'en';
  const [status, setStatus] = useState<SubmitStatus>('idle');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const formRef = useRef<HTMLFormElement>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);
    setStatus('loading');
    setErrorMessage('');

    try {
      const res = await fetch('/api/careers', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json().catch(() => ({}));

      if (res.ok && data.success !== false) {
        setStatus('success');
        formRef.current?.reset();
        return;
      }
      setStatus('error');
      setErrorMessage(
        typeof data.error === 'string'
          ? data.error
          : isEn
            ? 'An error occurred. Please try again.'
            : 'Une erreur est survenue. Veuillez réessayer.'
      );
    } catch {
      setStatus('error');
      setErrorMessage(isEn ? 'An error occurred. Please try again.' : 'Une erreur est survenue. Veuillez réessayer.');
    }
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      <section className="bg-gradient-to-r from-violet-600/90 to-fuchsia-600/90 text-white py-24">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <Briefcase className="w-16 h-16 mx-auto mb-6" />
          <h1 className="text-5xl font-bold mb-6">{isEn ? 'Join Luneo' : 'Rejoignez Luneo'}</h1>
          <p className="text-2xl text-white/90 mb-8">
            {isEn
              ? 'Build the future of AI agents for customer operations'
              : 'Construisons ensemble le futur des agents IA pour les opérations client'}
          </p>
          <Link
            href="#positions"
            className="bg-white/20 border-2 border-white/50 text-white px-8 py-3 rounded-lg font-semibold hover:bg-white/30 inline-block"
          >
            {isEn ? 'See open roles' : 'Voir les postes'}
          </Link>
        </div>
      </section>

      <section id="positions" className="max-w-5xl mx-auto px-4 py-20">
        <h2 className="text-4xl font-bold text-center mb-12 text-white">{isEn ? 'Open positions' : 'Postes ouverts'}</h2>
        <div className="rounded-xl border border-white/10 bg-white/5 p-8 text-center max-w-2xl mx-auto">
          <p className="text-xl text-white/90">
            {isEn ? 'All our current positions are filled' : 'Tous nos postes sont actuellement pourvus'}
          </p>
          <p className="text-white/60 mt-2">
            {isEn
              ? 'Check this page regularly or submit an open application below.'
              : 'Consultez cette page régulièrement ou envoyez-nous une candidature spontanée ci-dessous.'}
          </p>
        </div>
      </section>

      <section className="max-w-2xl mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-center mb-8 text-white">
          {isEn ? 'Open application' : 'Candidature spontanée'}
        </h2>
        <form
          ref={formRef}
          onSubmit={handleSubmit}
          className="space-y-6 rounded-xl border border-white/10 bg-white/5 p-8"
        >
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-white/80 mb-2">
              {isEn ? 'Full name' : 'Nom complet'}
            </label>
            <input
              id="name"
              name="name"
              type="text"
              required
              className="w-full rounded-lg border border-white/20 bg-white/5 px-4 py-3 text-white placeholder-white/40 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
              placeholder={isEn ? 'John Doe' : 'Jean Dupont'}
            />
          </div>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-white/80 mb-2">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              className="w-full rounded-lg border border-white/20 bg-white/5 px-4 py-3 text-white placeholder-white/40 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
              placeholder={isEn ? 'john@example.com' : 'jean@exemple.fr'}
            />
          </div>
          <div>
            <label htmlFor="message" className="block text-sm font-medium text-white/80 mb-2">
              {isEn ? 'Message / Motivation' : 'Message / Motivation'}
            </label>
            <textarea
              id="message"
              name="message"
              required
              rows={5}
              className="w-full rounded-lg border border-white/20 bg-white/5 px-4 py-3 text-white placeholder-white/40 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500 resize-y min-h-[120px]"
              placeholder={
                isEn
                  ? 'Introduce yourself and explain why you want to join Luneo...'
                  : 'Présentez-vous et expliquez pourquoi vous souhaitez nous rejoindre...'
              }
            />
          </div>
          <div>
            <label htmlFor="file" className="block text-sm font-medium text-white/80 mb-2">
              {isEn ? 'Resume (PDF, DOC or DOCX)' : 'CV (PDF, DOC ou DOCX)'}
            </label>
            <div className="flex items-center gap-3">
              <input
                id="file"
                name="file"
                type="file"
                required
                accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                className="block w-full text-sm text-white/80 file:mr-4 file:rounded-lg file:border-0 file:bg-violet-600 file:px-4 file:py-2 file:text-white file:hover:bg-violet-700"
              />
              <FileUp className="w-5 h-5 text-white/50 shrink-0" />
            </div>
          </div>

          {status === 'success' && (
            <div className="flex items-center gap-2 rounded-lg bg-emerald-500/20 text-emerald-300 px-4 py-3">
              <CheckCircle className="w-5 h-5 shrink-0" />
              <span>
                {isEn
                  ? 'Application submitted successfully. We will contact you if your profile matches our needs.'
                  : 'Candidature envoyée avec succès. Nous vous recontacterons si votre profil correspond à nos besoins.'}
              </span>
            </div>
          )}
          {status === 'error' && (
            <div className="flex items-center gap-2 rounded-lg bg-red-500/20 text-red-300 px-4 py-3">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={status === 'loading'}
            className="w-full flex items-center justify-center gap-2 rounded-lg bg-violet-600 px-6 py-3 font-semibold text-white hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {status === 'loading' ? (
              isEn ? 'Sending...' : 'Envoi en cours...'
            ) : (
              <>
                <Send className="w-5 h-5" />
                {isEn ? 'Submit my application' : 'Envoyer ma candidature'}
              </>
            )}
          </button>
        </form>
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
