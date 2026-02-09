'use client';

/**
 * Onboarding Flow - Multi-étapes
 * O-001: Flow d'onboarding interactif pour nouveaux utilisateurs
 */

import React, { useCallback, memo, useEffect } from 'react';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import {
  LazyMotionDiv as motion,
  LazyAnimatePresence as AnimatePresence,
} from '@/lib/performance/dynamic-motion';
import { useRouter } from 'next/navigation';
import {
  User,
  Building,
  Palette,
  Box,
  Camera,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Check,
  Rocket,
  Target,
  Zap,
  Crown,
  Globe,
  Plug,
  Image as ImageIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { logger } from '@/lib/logger';
import { useOnboardingStore } from '@/store/onboarding.store';
import { useIndustryStore } from '@/store/industry.store';
import { Step2Industry } from './components/Step2Industry';

const STEPS = [
  { id: 1, title: 'Profil', icon: User },
  { id: 2, title: 'Secteur d\'activité', icon: Building },
  { id: 3, title: 'Cas d\'usage', icon: Target },
  { id: 4, title: 'Objectifs', icon: Sparkles },
  { id: 5, title: 'Intégrations', icon: Plug },
  { id: 6, title: 'Terminé', icon: Rocket },
];

const USE_CASES = [
  {
    id: 'product-customizer',
    name: 'Configurateur Produits',
    description: 'Permettre à vos clients de personnaliser vos produits',
    icon: Palette,
  },
  {
    id: '3d-viewer',
    name: 'Visualisation 3D',
    description: 'Afficher vos produits en 3D interactif',
    icon: Box,
  },
  {
    id: 'virtual-tryon',
    name: 'Virtual Try-On',
    description: 'Essayage virtuel avec AR',
    icon: Camera,
  },
  {
    id: 'print-ready',
    name: 'Export Print-Ready',
    description: "Générer des fichiers prêts pour l'impression",
    icon: ImageIcon,
  },
];

const GOALS = [
  { id: 'increase-conversions', name: 'Augmenter les conversions', icon: Target },
  { id: 'reduce-returns', name: 'Réduire les retours', icon: ArrowLeft },
  { id: 'differentiate', name: 'Se différencier', icon: Crown },
  { id: 'automate', name: 'Automatiser', icon: Zap },
  { id: 'scale', name: "Passer à l'échelle", icon: Rocket },
  { id: 'expand-global', name: 'Expansion internationale', icon: Globe },
];

const INTEGRATIONS = [
  { id: 'shopify', name: 'Shopify', logo: '🛒' },
  { id: 'woocommerce', name: 'WooCommerce', logo: '🔌' },
  { id: 'magento', name: 'Magento', logo: '🎯' },
  { id: 'prestashop', name: 'PrestaShop', logo: '🏪' },
  { id: 'custom', name: 'Custom / API', logo: '⚙️' },
  { id: 'none', name: 'Pas encore décidé', logo: '❓' },
];

function OnboardingPageContent() {
  const router = useRouter();
  const {
    formData,
    currentStep,
    totalSteps,
    isSubmitting,
    selectedIndustry,
    fetchProgress,
    saveStep,
    nextStep,
    previousStep,
    setStepData,
    setSelectedIndustry,
    completeOnboarding,
    skipOnboarding,
  } = useOnboardingStore();

  const fetchAllIndustries = useIndustryStore((s) => s.fetchAllIndustries);

  useEffect(() => {
    fetchProgress();
  }, [fetchProgress]);

  useEffect(() => {
    fetchAllIndustries();
  }, [fetchAllIndustries]);

  const progress = (currentStep / STEPS.length) * 100;

  const toggleUseCase = useCallback(
    (id: string) => {
      const useCases = formData.step3.useCases.includes(id)
        ? formData.step3.useCases.filter((i) => i !== id)
        : [...formData.step3.useCases, id];
      setStepData('step3', { useCases });
    },
    [formData.step3.useCases, setStepData]
  );

  const toggleGoal = useCallback(
    (id: string) => {
      const goals = formData.step4.goals.includes(id)
        ? formData.step4.goals.filter((i) => i !== id)
        : [...formData.step4.goals, id];
      setStepData('step4', { goals });
    },
    [formData.step4.goals, setStepData]
  );

  const toggleIntegration = useCallback(
    (id: string) => {
      const integrations = formData.step5.integrations.includes(id)
        ? formData.step5.integrations.filter((i) => i !== id)
        : [...formData.step5.integrations, id];
      setStepData('step5', { integrations });
    },
    [formData.step5.integrations, setStepData]
  );

  const canProceed = useCallback(() => {
    switch (currentStep) {
      case 1:
        return formData.step1.name.length >= 2;
      case 2:
        return formData.step2.industrySlug !== '';
      case 3:
        return formData.step3.useCases.length >= 1;
      case 4:
        return formData.step4.goals.length >= 1;
      case 5:
        return formData.step5.integrations.length >= 1;
      case 6:
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
        router.push('/dashboard?onboarding=complete');
      } catch (err) {
        logger.error('Onboarding complete error:', err);
      }
    }
  }, [currentStep, totalSteps, saveStep, nextStep, completeOnboarding, router]);

  const handlePrevious = useCallback(() => {
    previousStep();
  }, [previousStep]);

  const handleSkip = useCallback(async () => {
    try {
      await skipOnboarding();
      router.push('/dashboard');
    } catch (err) {
      logger.error('Onboarding skip error:', err);
    }
  }, [skipOnboarding, router]);

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white flex items-center justify-center p-4">
      <div className="w-full max-w-3xl">
        {/* Progress */}
        <motion
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between mb-4">
            {STEPS.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                    currentStep > step.id
                      ? 'bg-[#8b5cf6] text-white'
                      : currentStep === step.id
                        ? 'bg-[#ec4899] text-white'
                        : 'bg-white/[0.2] border border-white/[0.06] text-white/40'
                  }`}
                >
                  {currentStep > step.id ? (
                    <Check className="w-5 h-5" />
                  ) : (
                    <step.icon className="w-5 h-5" />
                  )}
                </div>
                {index < STEPS.length - 1 && (
                  <div
                    className={`h-1 w-8 sm:w-12 mx-1 rounded ${
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

        {/* Content Card - dash-card */}
        <Card className="dash-card bg-white/[0.03] backdrop-blur-sm border border-white/[0.06] rounded-2xl p-8">
          <AnimatePresence mode="wait">
            {/* Step 1: Profil */}
            {currentStep === 1 && (
              <motion
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="text-center mb-8">
                  <h1 className="text-3xl font-bold mb-2 text-white">
                    Bienvenue sur Luneo ! 👋
                  </h1>
                  <p className="text-white/60">
                    Commençons par faire connaissance
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-white">Votre nom complet</Label>
                    <Input
                      placeholder="Jean Dupont"
                      value={formData.step1.name}
                      onChange={(e) =>
                        setStepData('step1', { name: e.target.value })
                      }
                      className="dash-input bg-white/[0.04] border-white/[0.06] text-white placeholder:text-white/40 h-12 rounded-xl"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-white">Nom de votre entreprise</Label>
                    <Input
                      placeholder="Ma Super Entreprise"
                      value={formData.step1.company}
                      onChange={(e) =>
                        setStepData('step1', { company: e.target.value })
                      }
                      className="dash-input bg-white/[0.04] border-white/[0.06] text-white placeholder:text-white/40 h-12 rounded-xl"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-white">Votre rôle</Label>
                      <Input
                        placeholder="CEO, Marketing..."
                        value={formData.step1.role}
                        onChange={(e) =>
                          setStepData('step1', { role: e.target.value })
                        }
                        className="dash-input bg-white/[0.04] border-white/[0.06] text-white placeholder:text-white/40 rounded-xl"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-white">Taille d&apos;équipe</Label>
                      <Input
                        placeholder="1-10, 10-50..."
                        value={formData.step1.teamSize}
                        onChange={(e) =>
                          setStepData('step1', { teamSize: e.target.value })
                        }
                        className="dash-input bg-white/[0.04] border-white/[0.06] text-white placeholder:text-white/40 rounded-xl"
                      />
                    </div>
                  </div>
                </div>
              </motion>
            )}

            {/* Step 2: Industry */}
            {currentStep === 2 && (
              <Step2Industry
                selectedIndustry={selectedIndustry}
                onSelectIndustry={setSelectedIndustry}
              />
            )}

            {/* Step 3: Use Cases */}
            {currentStep === 3 && (
              <motion
                key="step3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="text-center mb-8">
                  <h1 className="text-3xl font-bold mb-2 text-white">
                    Que souhaitez-vous faire ? 🎯
                  </h1>
                  <p className="text-white/60">
                    Selectionnez au moins un cas d&apos;usage
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {USE_CASES.map((useCase) => (
                    <motion
                      key={useCase.id}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => toggleUseCase(useCase.id)}
                      className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                        formData.step3.useCases.includes(useCase.id)
                          ? 'bg-white/[0.06] border-[#8b5cf6]'
                          : 'bg-white/[0.03] border-white/[0.06] hover:bg-white/[0.04] hover:border-white/[0.1]'
                      }`}
                    >
                      <useCase.icon
                        className={`w-8 h-8 mb-3 ${
                          formData.step3.useCases.includes(useCase.id)
                            ? 'text-[#8b5cf6]'
                            : 'text-white/40'
                        }`}
                      />
                      <h3 className="font-semibold mb-1 text-white">{useCase.name}</h3>
                      <p className="text-sm text-white/60">
                        {useCase.description}
                      </p>
                    </motion>
                  ))}
                </div>
              </motion>
            )}

            {/* Step 4: Goals */}
            {currentStep === 4 && (
              <motion
                key="step4"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="text-center mb-8">
                  <h1 className="text-3xl font-bold mb-2 text-white">
                    Vos objectifs ✨
                  </h1>
                  <p className="text-white/60">
                    Que voulez-vous accomplir avec Luneo ?
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {GOALS.map((goal) => (
                    <motion
                      key={goal.id}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => toggleGoal(goal.id)}
                      className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                        formData.step4.goals.includes(goal.id)
                          ? 'bg-white/[0.06] border-[#8b5cf6]'
                          : 'bg-white/[0.03] border-white/[0.06] hover:bg-white/[0.04] hover:border-white/[0.1]'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <goal.icon
                          className={`w-6 h-6 ${
                            formData.step4.goals.includes(goal.id)
                              ? 'text-[#8b5cf6]'
                              : 'text-white/40'
                          }`}
                        />
                        <span className="font-medium text-white">{goal.name}</span>
                        {formData.step4.goals.includes(goal.id) && (
                          <Check className="w-5 h-5 text-[#8b5cf6] ml-auto" />
                        )}
                      </div>
                    </motion>
                  ))}
                </div>
              </motion>
            )}

            {/* Step 5: Integrations */}
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
                    Vos intégrations 🔌
                  </h1>
                  <p className="text-white/60">
                    Quelle(s) plateforme(s) utilisez-vous ?
                  </p>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  {INTEGRATIONS.map((integration) => (
                    <motion
                      key={integration.id}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => toggleIntegration(integration.id)}
                      className={`p-4 rounded-2xl border text-center transition-all cursor-pointer ${
                        formData.step5.integrations.includes(integration.id)
                          ? 'bg-white/[0.06] border-[#8b5cf6]'
                          : 'bg-white/[0.03] border-white/[0.06] hover:bg-white/[0.04] hover:border-white/[0.1]'
                      }`}
                    >
                      <span className="text-3xl mb-2 block">
                        {integration.logo}
                      </span>
                      <span className="text-sm font-medium text-white">
                        {integration.name}
                      </span>
                      {formData.step5.integrations.includes(integration.id) && (
                        <Check className="w-4 h-4 text-[#8b5cf6] mx-auto mt-2" />
                      )}
                    </motion>
                  ))}
                </div>
              </motion>
            )}

            {/* Step 6: Complete */}
            {currentStep === 6 && (
              <motion
                key="step6"
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
                <h1 className="text-3xl font-bold mb-4 text-white">
                  Vous êtes prêt ! 🎉
                </h1>
                <p className="text-white/60 mb-8 max-w-md mx-auto">
                  Votre espace est configure. Explorez Luneo et commencez a
                  creer des experiences incroyables pour vos clients.
                </p>

                <div className="grid grid-cols-3 gap-4 mb-8 max-w-lg mx-auto">
                  <div className="p-4 bg-white/[0.04] border border-white/[0.06] rounded-2xl">
                    <p className="text-2xl font-bold text-[#8b5cf6]">Gratuit</p>
                    <p className="text-xs text-white/60">pour commencer</p>
                  </div>
                  <div className="p-4 bg-white/[0.04] border border-white/[0.06] rounded-2xl">
                    <p className="text-2xl font-bold text-[#ec4899]">5</p>
                    <p className="text-xs text-white/60">designs inclus</p>
                  </div>
                  <div className="p-4 bg-white/[0.04] border border-white/[0.06] rounded-2xl">
                    <p className="text-2xl font-bold text-[#8b5cf6]">24/7</p>
                    <p className="text-xs text-white/60">support</p>
                  </div>
                </div>
              </motion>
            )}
          </AnimatePresence>

          {/* Navigation */}
          <div className="flex items-center justify-between mt-8 pt-6 border-t border-white/[0.06]">
            <div>
              {currentStep > 1 && currentStep < 6 && (
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
              {currentStep < 6 && (
                <Button
                  variant="ghost"
                  onClick={handleSkip}
                  className="text-white/40 hover:text-white/60 hover:bg-white/[0.04]"
                >
                  Passer
                </Button>
              )}
              <Button
                onClick={handleNext}
                disabled={!canProceed() || isSubmitting}
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white min-w-[140px] border-0"
              >
                {isSubmitting ? (
                  'Chargement...'
                ) : currentStep === 6 ? (
                  <>
                    Accéder au dashboard
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </>
                ) : (
                  <>
                    Continuer
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>
            </div>
          </div>
        </Card>

        {/* Skip Link - hidden on final step */}
        {currentStep < 6 && (
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
              Vous pouvez toujours configurer cela plus tard
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
