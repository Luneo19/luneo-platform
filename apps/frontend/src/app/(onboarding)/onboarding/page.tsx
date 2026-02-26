'use client';

/**
 * Onboarding Flow V2 - 7 étapes pour Luneo Agents IA
 */

import React, { useCallback, memo, useEffect } from 'react';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import {
  LazyMotionDiv as motion,
  LazyAnimatePresence as AnimatePresence,
} from '@/lib/performance/dynamic-motion';
import { useRouter, useSearchParams } from 'next/navigation';
import { endpoints } from '@/lib/api/client';
import {
  User,
  Building,
  Target,
  ArrowRight,
  ArrowLeft,
  Check,
  Rocket,
  Bot,
  AlertCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { logger } from '@/lib/logger';
import { appRoutes } from '@/lib/routes';
import { useOnboardingStore } from '@/store/onboarding.store';
import { useAuth } from '@/hooks/useAuth';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const STEPS = [
  { id: 1, title: 'Bienvenue', icon: User },
  { id: 2, title: 'Organisation', icon: Building },
  { id: 3, title: 'Secteur', icon: Building },
  { id: 4, title: 'Taille', icon: Building },
  { id: 5, title: 'Objectif', icon: Target },
  { id: 6, title: 'Premier agent', icon: Bot },
  { id: 7, title: 'Terminé', icon: Rocket },
];

const SECTORS = [
  { value: 'ECOMMERCE', label: 'E-commerce' },
  { value: 'SAAS', label: 'SaaS' },
  { value: 'FINTECH', label: 'Fintech' },
  { value: 'HEALTHCARE', label: 'Santé' },
  { value: 'RETAIL', label: 'Retail' },
  { value: 'OTHER', label: 'Autre' },
];

const SIZES = [
  { value: 'SOLO', label: 'Solo (1 personne)' },
  { value: 'SMALL', label: 'Petite (2-10)' },
  { value: 'MEDIUM', label: 'Moyenne (11-50)' },
  { value: 'LARGE', label: 'Grande (51-200)' },
  { value: 'ENTERPRISE', label: 'Enterprise (200+)' },
];

const OBJECTIVES = [
  { id: 'support', label: 'Support client', templateSlug: 'support-agent' },
  { id: 'sales', label: 'Ventes', templateSlug: 'sales-sdr-agent' },
  { id: 'onboarding', label: 'Onboarding', templateSlug: 'onboarding-agent' },
  { id: 'other', label: 'Autre', templateSlug: '' },
];

const PAID_PLANS = ['pro', 'business', 'enterprise'];

function OnboardingPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const planFromUrl = searchParams.get('plan');
  const isReminder = searchParams.get('reminder') === '1';
  const { user } = useAuth();
  const {
    formData,
    currentStep,
    totalSteps,
    isSubmitting,
    isLoading,
    error: storeError,
    isCrawling,
    crawlError,
    fetchProgress,
    saveStep,
    nextStep,
    previousStep,
    setStepData,
    completeOnboarding,
    skipOnboarding,
    scanWebsite,
    createAgentFromOnboarding,
  } = useOnboardingStore();

  useEffect(() => {
    fetchProgress();
  }, [fetchProgress]);

  useEffect(() => {
    if (user && !formData.step1.firstName && !formData.step1.lastName) {
      setStepData('step1', {
        firstName: user.firstName || '',
        lastName: user.lastName || '',
      });
    }
  }, [user, formData.step1.firstName, formData.step1.lastName, setStepData]);

  const progress = (currentStep / totalSteps) * 100;

  const canProceed = useCallback(() => {
    switch (currentStep) {
      case 1:
        return (formData.step1.firstName?.trim()?.length ?? 0) >= 1;
      case 2:
        return (formData.step2.companyName?.trim()?.length ?? 0) >= 2;
      case 3:
        return formData.step3.sector !== '';
      case 4:
        return formData.step4.companySize !== '';
      case 5:
        return formData.step5.objective !== '';
      case 6:
      case 7:
        return true;
      default:
        return true;
    }
  }, [currentStep, formData]);

  const handleNext = useCallback(async () => {
    if (currentStep < totalSteps) {
      try {
        await saveStep(currentStep);
        nextStep();
      } catch {
        // Error already handled in store
      }
    } else {
      try {
        await completeOnboarding();
        if (planFromUrl && PAID_PLANS.includes(planFromUrl)) {
          try {
            const checkoutResponse = await endpoints.billing.subscribe(
              planFromUrl,
              undefined,
              'monthly',
            );
            const url = (checkoutResponse as { url?: string })?.url;
            if (url) {
              window.location.href = url;
              return;
            }
          } catch (checkoutErr) {
            logger.error('Failed to create checkout session after onboarding', checkoutErr);
            router.push(`${appRoutes.overview}?onboarding=complete&plan=${planFromUrl}`);
            return;
          }
        }
        router.push(`${appRoutes.overview}?onboarding=complete`);
      } catch (err) {
        logger.error('Onboarding complete error', err);
      }
    }
  }, [currentStep, totalSteps, saveStep, nextStep, completeOnboarding, router, planFromUrl]);

  const handlePrevious = useCallback(() => {
    previousStep();
  }, [previousStep]);

  const handleSkip = useCallback(async () => {
    try {
      await skipOnboarding();
      router.push(appRoutes.overview);
    } catch (err) {
      logger.error('Onboarding skip error', err);
    }
  }, [skipOnboarding, router]);

  const getCreateAgentUrl = () => {
    const obj = OBJECTIVES.find((o) => o.id === formData.step5.objective);
    if (obj?.templateSlug) {
      return `/agents/create?templateId=${obj.templateSlug}`;
    }
    return '/agents/new';
  };

  if (isLoading && !formData.step1.firstName && !formData.step1.lastName) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] text-white flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-2 border-white/[0.06] border-t-[#8b5cf6] mx-auto mb-4" />
          <p className="text-white/60">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white flex items-center justify-center p-4">
      <div className="w-full max-w-3xl">
        {isReminder && (
          <motion
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 p-3 bg-white/[0.04] border border-white/[0.06] rounded-xl text-sm text-white/70"
          >
            Finaliser l&apos;onboarding permet de personnaliser vos recommandations d&apos;agents IA.
          </motion>
        )}

        {storeError && (
          <motion
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start gap-3"
          >
            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-400">{storeError}</p>
          </motion>
        )}

        <motion
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between mb-4 overflow-x-auto">
            {STEPS.map((step, index) => (
              <div key={step.id} className="flex items-center flex-shrink-0">
                <div
                  className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center transition-colors ${
                    currentStep > step.id
                      ? 'bg-[#8b5cf6] text-white'
                      : currentStep === step.id
                        ? 'bg-[#ec4899] text-white'
                        : 'bg-white/[0.2] border border-white/[0.06] text-white/40'
                  }`}
                >
                  {currentStep > step.id ? (
                    <Check className="w-4 h-4 sm:w-5 sm:h-5" />
                  ) : (
                    <step.icon className="w-4 h-4 sm:w-5 sm:h-5" />
                  )}
                </div>
                {index < STEPS.length - 1 && (
                  <div
                    className={`h-1 w-4 sm:w-8 mx-0.5 sm:mx-1 rounded ${
                      currentStep > step.id
                        ? 'bg-gradient-to-r from-[#8b5cf6] to-[#ec4899]'
                        : 'bg-white/[0.2]'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
          <Progress
            value={progress}
            className="h-2 bg-white/[0.06] rounded-full"
            indicatorClassName="bg-gradient-to-r from-purple-600 to-pink-600 rounded-full"
          />
        </motion>

        <Card className="dash-card bg-white/[0.03] backdrop-blur-sm border border-white/[0.06] rounded-2xl p-8">
          <AnimatePresence mode="wait">
            {/* Step 1: Bienvenue */}
            {currentStep === 1 && (
              <motion
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="text-center mb-8">
                  <h1 className="text-3xl font-bold mb-2 text-white">Bienvenue sur Luneo !</h1>
                  <p className="text-white/60">Commençons par vous connaître</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-white">Prénom</Label>
                    <Input
                      placeholder="Jean"
                      value={formData.step1.firstName}
                      onChange={(e) => setStepData('step1', { firstName: e.target.value })}
                      className="dash-input bg-white/[0.04] border-white/[0.06] text-white placeholder:text-white/40 h-12 rounded-xl"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-white">Nom</Label>
                    <Input
                      placeholder="Dupont"
                      value={formData.step1.lastName}
                      onChange={(e) => setStepData('step1', { lastName: e.target.value })}
                      className="dash-input bg-white/[0.04] border-white/[0.06] text-white placeholder:text-white/40 h-12 rounded-xl"
                    />
                  </div>
                </div>
              </motion>
            )}

            {/* Step 2: Organisation */}
            {currentStep === 2 && (
              <motion
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="text-center mb-8">
                  <h1 className="text-3xl font-bold mb-2 text-white">Votre organisation</h1>
                  <p className="text-white/60">Nom de l&apos;entreprise et site web</p>
                </div>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-white">Nom de l&apos;entreprise</Label>
                    <Input
                      placeholder="Mon Entreprise"
                      value={formData.step2.companyName}
                      onChange={(e) => setStepData('step2', { companyName: e.target.value })}
                      className="dash-input bg-white/[0.04] border-white/[0.06] text-white placeholder:text-white/40 h-12 rounded-xl"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-white">Site web</Label>
                    <Input
                      placeholder="https://www.example.com"
                      value={formData.step2.website}
                      onChange={(e) => setStepData('step2', { website: e.target.value })}
                      className="dash-input bg-white/[0.04] border-white/[0.06] text-white placeholder:text-white/40 h-12 rounded-xl"
                    />
                  </div>
                </div>
              </motion>
            )}

            {/* Step 3: Secteur */}
            {currentStep === 3 && (
              <motion
                key="step3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="text-center mb-8">
                  <h1 className="text-3xl font-bold mb-2 text-white">Votre secteur</h1>
                  <p className="text-white/60">Dans quel secteur évoluez-vous ?</p>
                </div>
                <Select
                  value={formData.step3.sector}
                  onValueChange={(v) => setStepData('step3', { sector: v })}
                >
                  <SelectTrigger className="dash-input bg-white/[0.04] border-white/[0.06] text-white h-12 rounded-xl">
                    <SelectValue placeholder="Sélectionnez un secteur" />
                  </SelectTrigger>
                  <SelectContent>
                    {SECTORS.map((s) => (
                      <SelectItem key={s.value} value={s.value}>
                        {s.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </motion>
            )}

            {/* Step 4: Taille */}
            {currentStep === 4 && (
              <motion
                key="step4"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="text-center mb-8">
                  <h1 className="text-3xl font-bold mb-2 text-white">Taille de l&apos;entreprise</h1>
                  <p className="text-white/60">Combien de personnes dans votre équipe ?</p>
                </div>
                <Select
                  value={formData.step4.companySize}
                  onValueChange={(v) => setStepData('step4', { companySize: v })}
                >
                  <SelectTrigger className="dash-input bg-white/[0.04] border-white/[0.06] text-white h-12 rounded-xl">
                    <SelectValue placeholder="Sélectionnez une taille" />
                  </SelectTrigger>
                  <SelectContent>
                    {SIZES.map((s) => (
                      <SelectItem key={s.value} value={s.value}>
                        {s.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </motion>
            )}

            {/* Step 5: Objectif */}
            {currentStep === 5 && (
              <motion
                key="step5"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="text-center mb-8">
                  <h1 className="text-3xl font-bold mb-2 text-white">
                    Quel est votre objectif principal ?
                  </h1>
                  <p className="text-white/60">Nous adapterons les templates à votre besoin</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  {OBJECTIVES.map((obj) => (
                    <motion
                      key={obj.id}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setStepData('step5', { objective: obj.id })}
                      className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                        formData.step5.objective === obj.id
                          ? 'bg-white/[0.06] border-[#8b5cf6]'
                          : 'bg-white/[0.03] border-white/[0.06] hover:bg-white/[0.04]'
                      }`}
                    >
                      <span className="font-medium text-white">{obj.label}</span>
                      {formData.step5.objective === obj.id && (
                        <Check className="w-5 h-5 text-[#8b5cf6] mt-2" />
                      )}
                    </motion>
                  ))}
                </div>
              </motion>
            )}

            {/* Step 6: Premier agent */}
            {currentStep === 6 && (
              <motion
                key="step6"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="text-center mb-8">
                  <h1 className="text-3xl font-bold mb-2 text-white">Créez votre premier agent</h1>
                  <p className="text-white/60">
                    Un template a été présélectionné selon votre objectif
                  </p>
                </div>
                <Button
                  className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white h-12"
                  disabled={isSubmitting || isCrawling}
                  onClick={async () => {
                    try {
                      if (formData.step2.website?.trim()) {
                        await scanWebsite(formData.step2.website.trim(), formData.step2.industry || formData.step3.sector);
                      }
                      const createdAgentId = await createAgentFromOnboarding();
                      await completeOnboarding();
                      if (createdAgentId) {
                        router.push(`/agents/${createdAgentId}`);
                        return;
                      }
                      router.push(getCreateAgentUrl());
                    } catch (err) {
                      logger.error('Failed to complete onboarding before agent creation', err);
                      router.push(getCreateAgentUrl());
                    }
                  }}
                >
                  <Bot className="w-5 h-5 mr-2" />
                  {isSubmitting || isCrawling ? 'Chargement...' : 'Créer mon premier agent'}
                </Button>
                {crawlError && (
                  <p className="text-center text-amber-400/80 text-sm">{crawlError}</p>
                )}
                <p className="text-center text-white/40 text-sm">
                  Vous pourrez aussi le faire plus tard depuis le dashboard
                </p>
              </motion>
            )}

            {/* Step 7: Terminé */}
            {currentStep === 7 && (
              <motion
                key="step7"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="text-center py-8"
              >
                <motion
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', delay: 0.2 }}
                  className="w-24 h-24 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full flex items-center justify-center mx-auto mb-6"
                >
                  <Rocket className="w-12 h-12 text-white" />
                </motion>
                <h1 className="text-3xl font-bold mb-4 text-white">Tout est prêt !</h1>
                <p className="text-white/60 mb-8 max-w-md mx-auto">
                  {planFromUrl && PAID_PLANS.includes(planFromUrl)
                    ? `Votre espace est configuré. Vous allez être redirigé vers le paiement pour activer votre plan ${planFromUrl}.`
                    : 'Votre espace est configuré. Créez vos agents IA et automatisez votre support client.'}
                </p>
                <div className="grid grid-cols-2 gap-4 mb-8 max-w-md mx-auto">
                  <div className="p-4 bg-white/[0.04] border border-white/[0.06] rounded-2xl">
                    <p className="text-xl font-bold text-[#8b5cf6]">Agents IA</p>
                    <p className="text-xs text-white/60">À votre disposition</p>
                  </div>
                  <div className="p-4 bg-white/[0.04] border border-white/[0.06] rounded-2xl">
                    <p className="text-xl font-bold text-[#ec4899]">24/7</p>
                    <p className="text-xs text-white/60">Support</p>
                  </div>
                </div>
              </motion>
            )}
          </AnimatePresence>

          <div className="flex items-center justify-between mt-8 pt-6 border-t border-white/[0.06]">
            <div>
              {currentStep > 1 && currentStep < 7 && (
                <Button
                  variant="ghost"
                  onClick={handlePrevious}
                  className="text-white/60 hover:text-white hover:bg-white/[0.04]"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Retour
                </Button>
              )}
            </div>
            <div className="flex items-center gap-3">
              {currentStep < 7 && currentStep !== 6 && (
                <Button
                  variant="ghost"
                  onClick={handleSkip}
                  className="text-white/40 hover:text-white/60 hover:bg-white/[0.04]"
                >
                  Passer
                </Button>
              )}
              {currentStep === 6 ? (
                <Button
                  onClick={() => nextStep()}
                  className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white min-w-[140px] border-0"
                >
                  Continuer
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              ) : (
                <Button
                  onClick={handleNext}
                  disabled={!canProceed() || isSubmitting}
                  className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white min-w-[140px] border-0"
                >
                  {isSubmitting ? (
                    'Chargement...'
                  ) : currentStep === 7 ? (
                    <>
                      {planFromUrl && PAID_PLANS.includes(planFromUrl)
                        ? 'Procéder au paiement'
                        : 'Accéder au dashboard'}
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </>
                  ) : (
                    <>
                      Continuer
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        </Card>

        {currentStep < 7 && currentStep !== 6 && (
          <motion
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-center mt-6"
          >
            <button
              onClick={handleSkip}
              className="text-sm text-white/40 hover:text-white/60 transition-colors"
            >
              Configurer plus tard
            </button>
          </motion>
        )}
      </div>
    </div>
  );
}

const OnboardingPageMemo = memo(OnboardingPageContent);

export default function OnboardingPage() {
  return (
    <ErrorBoundary componentName="OnboardingPage">
      <OnboardingPageMemo />
    </ErrorBoundary>
  );
}
