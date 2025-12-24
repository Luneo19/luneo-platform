'use client';

/**
 * Onboarding Flow - Multi-étapes
 * O-001: Flow d'onboarding interactif pour nouveaux utilisateurs
 */

import React, { useState, useCallback, memo } from 'react';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import {
  User,
  Building,
  Palette,
  ShoppingBag,
  Box,
  Shirt,
  Coffee,
  Gift,
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
  Store,
  Image as ImageIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { logger } from '../../../lib/logger';

// Types
interface OnboardingData {
  // Step 1: Profil
  fullName: string;
  company: string;
  role: string;
  teamSize: string;
  // Step 2: Cas d'usage
  useCase: string;
  industry: string;
  // Step 3: Objectifs
  goals: string[];
  // Step 4: Intégrations
  integrations: string[];
}

const STEPS = [
  { id: 1, title: 'Profil', icon: User },
  { id: 2, title: 'Cas d\'usage', icon: Target },
  { id: 3, title: 'Objectifs', icon: Sparkles },
  { id: 4, title: 'Intégrations', icon: Plug },
  { id: 5, title: 'Terminé', icon: Rocket },
];

const INDUSTRIES = [
  { id: 'fashion', name: 'Mode & Textile', icon: Shirt },
  { id: 'ecommerce', name: 'E-commerce', icon: ShoppingBag },
  { id: 'print', name: 'Impression', icon: ImageIcon },
  { id: 'gifts', name: 'Cadeaux & Goodies', icon: Gift },
  { id: 'promotional', name: 'Produits Promo', icon: Coffee },
  { id: 'packaging', name: 'Packaging', icon: Box },
];

const USE_CASES = [
  { id: 'product-customizer', name: 'Configurateur Produits', description: 'Permettre à vos clients de personnaliser vos produits', icon: Palette },
  { id: '3d-viewer', name: 'Visualisation 3D', description: 'Afficher vos produits en 3D interactif', icon: Box },
  { id: 'virtual-tryon', name: 'Virtual Try-On', description: 'Essayage virtuel avec AR', icon: Camera },
  { id: 'print-ready', name: 'Export Print-Ready', description: 'Générer des fichiers prêts pour l\'impression', icon: ImageIcon },
];

const GOALS = [
  { id: 'increase-conversions', name: 'Augmenter les conversions', icon: Target },
  { id: 'reduce-returns', name: 'Réduire les retours', icon: ArrowLeft },
  { id: 'differentiate', name: 'Se différencier', icon: Crown },
  { id: 'automate', name: 'Automatiser', icon: Zap },
  { id: 'scale', name: 'Passer à l\'échelle', icon: Rocket },
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
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [data, setData] = useState<OnboardingData>({
    fullName: '',
    company: '',
    role: '',
    teamSize: '',
    useCase: '',
    industry: '',
    goals: [],
    integrations: [],
  });

  const progress = (currentStep / STEPS.length) * 100;

  const updateData = useCallback((updates: Partial<OnboardingData>) => {
    setData(prev => ({ ...prev, ...updates }));
  }, []);

  const toggleArrayItem = useCallback((field: 'goals' | 'integrations', item: string) => {
    setData(prev => ({
      ...prev,
      [field]: prev[field].includes(item)
        ? prev[field].filter(i => i !== item)
        : [...prev[field], item],
    }));
  }, []);

  const canProceed = useCallback(() => {
    switch (currentStep) {
      case 1:
        return data.fullName.length >= 2;
      case 2:
        return data.useCase !== '';
      case 3:
        return data.goals.length >= 1;
      case 4:
        return data.integrations.length >= 1;
      default:
        return true;
    }
  }, [currentStep, data]);

  const handleNext = useCallback(async () => {
    if (currentStep < STEPS.length) {
      setCurrentStep(prev => prev + 1);
    } else {
      // Finish onboarding
      setIsSubmitting(true);
      try {
        await fetch('/api/auth/onboarding/complete', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });
        router.push('/overview?onboarding=complete');
      } catch (error) {
        logger.error('Onboarding error:', error);
      } finally {
        setIsSubmitting(false);
      }
    }
  }, [currentStep, data, router]);

  const handlePrevious = useCallback(() => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    }
  }, [currentStep]);

  const handleSkip = useCallback(() => {
    router.push('/overview');
  }, [router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white flex items-center justify-center p-4">
      <div className="w-full max-w-3xl">
        {/* Progress */}
        <motion.div
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
                      ? 'bg-blue-600'
                      : 'bg-slate-800 border border-slate-700'
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
                    className={`h-1 w-12 sm:w-20 mx-2 rounded ${
                      currentStep > step.id ? 'bg-blue-600' : 'bg-slate-800'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
          <Progress value={progress} className="h-2 bg-slate-800" />
        </motion.div>

        {/* Content Card */}
        <Card className="bg-slate-900/50 border-slate-800 backdrop-blur-sm p-8">
          <AnimatePresence mode="wait">
            {/* Step 1: Profil */}
            {currentStep === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="text-center mb-8">
                  <h1 className="text-3xl font-bold mb-2">Bienvenue sur Luneo ! 👋</h1>
                  <p className="text-slate-400">Commençons par faire connaissance</p>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Votre nom complet</Label>
                    <Input
                      placeholder="Jean Dupont"
                      value={data.fullName}
                      onChange={(e) => updateData({ fullName: e.target.value })}
                      className="bg-slate-800 border-slate-700 h-12"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Nom de votre entreprise</Label>
                    <Input
                      placeholder="Ma Super Entreprise"
                      value={data.company}
                      onChange={(e) => updateData({ company: e.target.value })}
                      className="bg-slate-800 border-slate-700 h-12"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Votre rôle</Label>
                      <Input
                        placeholder="CEO, Marketing..."
                        value={data.role}
                        onChange={(e) => updateData({ role: e.target.value })}
                        className="bg-slate-800 border-slate-700"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Taille d'équipe</Label>
                      <Input
                        placeholder="1-10, 10-50..."
                        value={data.teamSize}
                        onChange={(e) => updateData({ teamSize: e.target.value })}
                        className="bg-slate-800 border-slate-700"
                      />
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Step 2: Use Case */}
            {currentStep === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="text-center mb-8">
                  <h1 className="text-3xl font-bold mb-2">Que souhaitez-vous faire ? 🎯</h1>
                  <p className="text-slate-400">Sélectionnez votre cas d'usage principal</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {USE_CASES.map((useCase) => (
                    <motion.button
                      key={useCase.id}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => updateData({ useCase: useCase.id })}
                      className={`p-4 rounded-xl border text-left transition-all ${
                        data.useCase === useCase.id
                          ? 'bg-blue-600/20 border-blue-500'
                          : 'bg-slate-800/50 border-slate-700 hover:border-slate-600'
                      }`}
                    >
                      <useCase.icon className={`w-8 h-8 mb-3 ${data.useCase === useCase.id ? 'text-blue-400' : 'text-slate-400'}`} />
                      <h3 className="font-semibold mb-1">{useCase.name}</h3>
                      <p className="text-sm text-slate-400">{useCase.description}</p>
                    </motion.button>
                  ))}
                </div>

                <div className="mt-6">
                  <Label className="mb-3 block">Votre industrie</Label>
                  <div className="grid grid-cols-3 gap-3">
                    {INDUSTRIES.map((industry) => (
                      <motion.button
                        key={industry.id}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => updateData({ industry: industry.id })}
                        className={`p-3 rounded-lg border text-center transition-all ${
                          data.industry === industry.id
                            ? 'bg-blue-600/20 border-blue-500'
                            : 'bg-slate-800/50 border-slate-700 hover:border-slate-600'
                        }`}
                      >
                        <industry.icon className={`w-6 h-6 mx-auto mb-2 ${data.industry === industry.id ? 'text-blue-400' : 'text-slate-400'}`} />
                        <span className="text-sm">{industry.name}</span>
                      </motion.button>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {/* Step 3: Goals */}
            {currentStep === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="text-center mb-8">
                  <h1 className="text-3xl font-bold mb-2">Vos objectifs ✨</h1>
                  <p className="text-slate-400">Que voulez-vous accomplir avec Luneo ?</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {GOALS.map((goal) => (
                    <motion.button
                      key={goal.id}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => toggleArrayItem('goals', goal.id)}
                      className={`p-4 rounded-xl border text-left transition-all ${
                        data.goals.includes(goal.id)
                          ? 'bg-green-600/20 border-green-500'
                          : 'bg-slate-800/50 border-slate-700 hover:border-slate-600'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <goal.icon className={`w-6 h-6 ${data.goals.includes(goal.id) ? 'text-green-400' : 'text-slate-400'}`} />
                        <span className="font-medium">{goal.name}</span>
                        {data.goals.includes(goal.id) && (
                          <Check className="w-5 h-5 text-green-400 ml-auto" />
                        )}
                      </div>
                    </motion.button>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Step 4: Integrations */}
            {currentStep === 4 && (
              <motion.div
                key="step4"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="text-center mb-8">
                  <h1 className="text-3xl font-bold mb-2">Vos intégrations 🔌</h1>
                  <p className="text-slate-400">Quelle(s) plateforme(s) utilisez-vous ?</p>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  {INTEGRATIONS.map((integration) => (
                    <motion.button
                      key={integration.id}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => toggleArrayItem('integrations', integration.id)}
                      className={`p-4 rounded-xl border text-center transition-all ${
                        data.integrations.includes(integration.id)
                          ? 'bg-purple-600/20 border-purple-500'
                          : 'bg-slate-800/50 border-slate-700 hover:border-slate-600'
                      }`}
                    >
                      <span className="text-3xl mb-2 block">{integration.logo}</span>
                      <span className="text-sm font-medium">{integration.name}</span>
                      {data.integrations.includes(integration.id) && (
                        <Check className="w-4 h-4 text-purple-400 mx-auto mt-2" />
                      )}
                    </motion.button>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Step 5: Complete */}
            {currentStep === 5 && (
              <motion.div
                key="step5"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="text-center py-8"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', delay: 0.2 }}
                  className="w-24 h-24 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6"
                >
                  <Rocket className="w-12 h-12 text-white" />
                </motion.div>
                <h1 className="text-3xl font-bold mb-4">Vous êtes prêt ! 🎉</h1>
                <p className="text-slate-400 mb-8 max-w-md mx-auto">
                  Votre espace est configuré. Explorez Luneo et commencez à créer des expériences incroyables pour vos clients.
                </p>

                <div className="grid grid-cols-3 gap-4 mb-8 max-w-lg mx-auto">
                  <div className="p-4 bg-slate-800/50 rounded-lg">
                    <p className="text-2xl font-bold text-blue-400">14</p>
                    <p className="text-xs text-slate-400">jours d'essai</p>
                  </div>
                  <div className="p-4 bg-slate-800/50 rounded-lg">
                    <p className="text-2xl font-bold text-green-400">∞</p>
                    <p className="text-xs text-slate-400">designs</p>
                  </div>
                  <div className="p-4 bg-slate-800/50 rounded-lg">
                    <p className="text-2xl font-bold text-purple-400">24/7</p>
                    <p className="text-xs text-slate-400">support</p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Navigation */}
          <div className="flex items-center justify-between mt-8 pt-6 border-t border-slate-800">
            <div>
              {currentStep > 1 && currentStep < 5 && (
                <Button variant="ghost" onClick={handlePrevious}>
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Retour
                </Button>
              )}
            </div>
            <div className="flex items-center gap-3">
              {currentStep < 5 && (
                <Button variant="ghost" onClick={handleSkip} className="text-slate-400">
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
                ) : currentStep === 5 ? (
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

        {/* Skip Link */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-center mt-6"
        >
          <button
            onClick={handleSkip}
            className="text-sm text-slate-500 hover:text-slate-400 transition-colors"
          >
            Vous pouvez toujours configurer cela plus tard
          </button>
        </motion.div>
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
