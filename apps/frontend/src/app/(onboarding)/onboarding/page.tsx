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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50 text-gray-900 flex items-center justify-center p-4">
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
                    currentStep >= step.id
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 border border-gray-300 text-gray-500'
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
                      currentStep > step.id ? 'bg-blue-600' : 'bg-gray-200'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
          <Progress value={progress} className="h-2 bg-gray-200" />
        </motion>

        {/* Content Card */}
        <Card className="bg-white border-gray-200 shadow-lg p-8">
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
                  <h1 className="text-3xl font-bold mb-2">
                    Bienvenue sur Luneo ! 👋
                  </h1>
                  <p className="text-gray-500">
                    Commençons par faire connaissance
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Votre nom complet</Label>
                    <Input
                      placeholder="Jean Dupont"
                      value={formData.step1.name}
                      onChange={(e) =>
                        setStepData('step1', { name: e.target.value })
                      }
                      className="bg-gray-50 border-gray-300 h-12"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Nom de votre entreprise</Label>
                    <Input
                      placeholder="Ma Super Entreprise"
                      value={formData.step1.company}
                      onChange={(e) =>
                        setStepData('step1', { company: e.target.value })
                      }
                      className="bg-gray-50 border-gray-300 h-12"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Votre rôle</Label>
                      <Input
                        placeholder="CEO, Marketing..."
                        value={formData.step1.role}
                        onChange={(e) =>
                          setStepData('step1', { role: e.target.value })
                        }
                        className="bg-gray-50 border-gray-300"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Taille d&apos;équipe</Label>
                      <Input
                        placeholder="1-10, 10-50..."
                        value={formData.step1.teamSize}
                        onChange={(e) =>
                          setStepData('step1', { teamSize: e.target.value })
                        }
                        className="bg-gray-50 border-gray-300"
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
                  <h1 className="text-3xl font-bold mb-2">
                    Que souhaitez-vous faire ? 🎯
                  </h1>
                  <p className="text-gray-500">
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
                      className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
                        formData.step3.useCases.includes(useCase.id)
                          ? 'bg-blue-50 border-blue-500'
                          : 'bg-gray-50 border-gray-200 hover:border-gray-400'
                      }`}
                    >
                      <useCase.icon
                        className={`w-8 h-8 mb-3 ${
                          formData.step3.useCases.includes(useCase.id)
                            ? 'text-blue-600'
                            : 'text-gray-400'
                        }`}
                      />
                      <h3 className="font-semibold mb-1">{useCase.name}</h3>
                      <p className="text-sm text-gray-500">
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
                  <h1 className="text-3xl font-bold mb-2">
                    Vos objectifs ✨
                  </h1>
                  <p className="text-gray-500">
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
                      className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
                        formData.step4.goals.includes(goal.id)
                          ? 'bg-green-50 border-green-500'
                          : 'bg-gray-50 border-gray-200 hover:border-gray-400'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <goal.icon
                          className={`w-6 h-6 ${
                            formData.step4.goals.includes(goal.id)
                              ? 'text-green-600'
                              : 'text-gray-400'
                          }`}
                        />
                        <span className="font-medium">{goal.name}</span>
                        {formData.step4.goals.includes(goal.id) && (
                          <Check className="w-5 h-5 text-green-600 ml-auto" />
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
                  <h1 className="text-3xl font-bold mb-2">
                    Vos intégrations 🔌
                  </h1>
                  <p className="text-gray-500">
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
                      className={`p-4 rounded-xl border text-center transition-all cursor-pointer ${
                        formData.step5.integrations.includes(integration.id)
                          ? 'bg-purple-50 border-purple-500'
                          : 'bg-gray-50 border-gray-200 hover:border-gray-400'
                      }`}
                    >
                      <span className="text-3xl mb-2 block">
                        {integration.logo}
                      </span>
                      <span className="text-sm font-medium">
                        {integration.name}
                      </span>
                      {formData.step5.integrations.includes(integration.id) && (
                        <Check className="w-4 h-4 text-purple-600 mx-auto mt-2" />
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
                  className="w-24 h-24 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6"
                >
                  <Rocket className="w-12 h-12 text-white" />
                </motion>
                <h1 className="text-3xl font-bold mb-4">
                  Vous êtes prêt ! 🎉
                </h1>
                <p className="text-gray-500 mb-8 max-w-md mx-auto">
                  Votre espace est configure. Explorez Luneo et commencez a
                  creer des experiences incroyables pour vos clients.
                </p>

                <div className="grid grid-cols-3 gap-4 mb-8 max-w-lg mx-auto">
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <p className="text-2xl font-bold text-blue-600">Gratuit</p>
                    <p className="text-xs text-gray-500">pour commencer</p>
                  </div>
                  <div className="p-4 bg-green-50 rounded-lg">
                    <p className="text-2xl font-bold text-green-600">5</p>
                    <p className="text-xs text-gray-500">designs inclus</p>
                  </div>
                  <div className="p-4 bg-purple-50 rounded-lg">
                    <p className="text-2xl font-bold text-purple-600">24/7</p>
                    <p className="text-xs text-gray-500">support</p>
                  </div>
                </div>
              </motion>
            )}
          </AnimatePresence>

          {/* Navigation */}
          <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-200">
            <div>
              {currentStep > 1 && currentStep < 6 && (
                <Button variant="ghost" onClick={handlePrevious}>
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
                  className="text-gray-500"
                >
                  Passer
                </Button>
              )}
              <Button
                onClick={handleNext}
                disabled={!canProceed() || isSubmitting}
                className="bg-blue-600 hover:bg-blue-700 min-w-[140px]"
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
              className="text-sm text-gray-500 hover:text-gray-400 transition-colors"
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
