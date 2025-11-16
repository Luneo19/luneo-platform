import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle, Code, Shield, Settings, ExternalLink, Copy, Check } from 'lucide-react';
import { cn } from '../lib/utils';

export type OnboardingStep = 'welcome' | 'installation' | 'permissions' | 'testing' | 'complete';

interface OnboardingOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  shopDomain?: string;
  apiKey?: string;
  onStepComplete?: (step: OnboardingStep) => void;
  className?: string;
}

interface Step {
  id: OnboardingStep;
  title: string;
  description: string;
  content: React.ReactNode;
  icon: React.ReactNode;
}

export const OnboardingOverlay: React.FC<OnboardingOverlayProps> = ({
  isOpen,
  onClose,
  shopDomain = 'your-shop.myshopify.com',
  apiKey = 'YOUR_API_KEY',
  onStepComplete,
  className,
}) => {
  const [currentStep, setCurrentStep] = useState<OnboardingStep>('welcome');
  const [copiedCode, setCopiedCode] = useState(false);
  const [completedSteps, setCompletedSteps] = useState<Set<OnboardingStep>>(new Set());

  useEffect(() => {
    if (!isOpen) {
      setCurrentStep('welcome');
      setCompletedSteps(new Set());
    }
  }, [isOpen]);

  const steps: Step[] = [
    {
      id: 'welcome',
      title: 'Bienvenue sur Luneo Widget',
      description: 'Installez le widget en 3 étapes simples',
      icon: <CheckCircle className="w-6 h-6" />,
      content: (
        <div className="space-y-4">
          <p className="text-gray-600">
            Le widget Luneo permet à vos clients de créer des designs personnalisés directement sur votre site.
          </p>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-semibold text-blue-900 mb-2">Ce que vous allez faire :</h4>
            <ul className="space-y-2 text-sm text-blue-800">
              <li className="flex items-start">
                <CheckCircle className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" />
                <span>Copier le code d'installation</span>
              </li>
              <li className="flex items-start">
                <CheckCircle className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" />
                <span>Configurer les permissions nécessaires</span>
              </li>
              <li className="flex items-start">
                <CheckCircle className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" />
                <span>Tester le widget sur votre site</span>
              </li>
            </ul>
          </div>
        </div>
      ),
    },
    {
      id: 'installation',
      title: 'Installation du Widget',
      description: 'Ajoutez le code à votre site',
      icon: <Code className="w-6 h-6" />,
      content: (
        <div className="space-y-4">
          <p className="text-gray-600">
            Copiez ce code et ajoutez-le avant la balise <code className="bg-gray-100 px-1 rounded">&lt;/body&gt;</code> de votre site.
          </p>
          
          <div className="bg-gray-900 rounded-lg p-4 relative">
            <button
              onClick={() => {
                const code = getInstallationCode();
                navigator.clipboard.writeText(code);
                setCopiedCode(true);
                setTimeout(() => setCopiedCode(false), 2000);
              }}
              className="absolute top-2 right-2 p-2 text-gray-400 hover:text-white transition-colors"
              title="Copier le code"
            >
              {copiedCode ? (
                <Check className="w-4 h-4 text-green-400" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
            </button>
            <pre className="text-xs text-gray-300 overflow-x-auto">
              <code>{getInstallationCode()}</code>
            </pre>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h4 className="font-semibold text-yellow-900 mb-2">💡 Où ajouter le code ?</h4>
            <ul className="space-y-1 text-sm text-yellow-800">
              <li>• <strong>Shopify:</strong> Thème → Actions → Modifier le code → theme.liquid</li>
              <li>• <strong>WooCommerce:</strong> Apparence → Éditeur de thème → footer.php</li>
              <li>• <strong>HTML personnalisé:</strong> Avant la balise &lt;/body&gt;</li>
            </ul>
          </div>

          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <ExternalLink className="w-4 h-4" />
            <a
              href="https://docs.luneo.app/widget/installation"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline"
            >
              Guide d'installation détaillé
            </a>
          </div>
        </div>
      ),
    },
    {
      id: 'permissions',
      title: 'Permissions Requises',
      description: 'Configurez les accès nécessaires',
      icon: <Shield className="w-6 h-6" />,
      content: (
        <div className="space-y-4">
          <p className="text-gray-600">
            Le widget nécessite certaines permissions pour fonctionner correctement. Voici ce qui est requis :
          </p>

          <div className="space-y-3">
            <PermissionItem
              title="Accès à l'API"
              description="Pour générer les designs avec l'IA"
              required={true}
              status="configured"
            />
            <PermissionItem
              title="Stockage des designs"
              description="Pour sauvegarder les créations des clients"
              required={true}
              status="configured"
            />
            <PermissionItem
              title="Accès au panier"
              description="Pour ajouter les designs personnalisés au panier"
              required={false}
              status="optional"
            />
            <PermissionItem
              title="Notifications"
              description="Pour vous informer des nouvelles commandes"
              required={false}
              status="optional"
            />
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-semibold text-blue-900 mb-2">🔒 Sécurité</h4>
            <p className="text-sm text-blue-800">
              Toutes les données sont chiffrées et sécurisées. Le widget utilise des tokens à durée limitée pour protéger votre API.
            </p>
          </div>

          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <Settings className="w-4 h-4" />
            <a
              href={`/dashboard/settings?shop=${shopDomain}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline"
            >
              Configurer les permissions dans les paramètres
            </a>
          </div>
        </div>
      ),
    },
    {
      id: 'testing',
      title: 'Test du Widget',
      description: 'Vérifiez que tout fonctionne',
      icon: <CheckCircle className="w-6 h-6" />,
      content: (
        <div className="space-y-4">
          <p className="text-gray-600">
            Testez le widget sur votre site pour vous assurer que tout fonctionne correctement.
          </p>

          <div className="space-y-3">
            <TestChecklistItem
              label="Le widget s'affiche correctement"
              checked={false}
            />
            <TestChecklistItem
              label="Le champ de saisie fonctionne"
              checked={false}
            />
            <TestChecklistItem
              label="La génération de design fonctionne"
              checked={false}
            />
            <TestChecklistItem
              label="Le téléchargement fonctionne"
              checked={false}
            />
            <TestChecklistItem
              label="L'ajout au panier fonctionne (si configuré)"
              checked={false}
            />
          </div>

          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h4 className="font-semibold text-green-900 mb-2">✅ Prêt à l'emploi</h4>
            <p className="text-sm text-green-800">
              Une fois tous les tests validés, votre widget est prêt à être utilisé par vos clients !
            </p>
          </div>

          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <ExternalLink className="w-4 h-4" />
            <a
              href={`https://${shopDomain}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline"
            >
              Ouvrir votre site dans un nouvel onglet
            </a>
          </div>
        </div>
      ),
    },
    {
      id: 'complete',
      title: 'Installation Terminée !',
      description: 'Votre widget est prêt à être utilisé',
      icon: <CheckCircle className="w-6 h-6" />,
      content: (
        <div className="space-y-4 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <h3 className="text-xl font-bold text-gray-900">Félicitations !</h3>
          <p className="text-gray-600">
            Votre widget Luneo est maintenant installé et configuré. Vos clients peuvent maintenant créer des designs personnalisés directement sur votre site.
          </p>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-left">
            <h4 className="font-semibold text-blue-900 mb-2">Prochaines étapes :</h4>
            <ul className="space-y-2 text-sm text-blue-800">
              <li className="flex items-start">
                <CheckCircle className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" />
                <span>Testez le widget sur votre site</span>
              </li>
              <li className="flex items-start">
                <CheckCircle className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" />
                <span>Personnalisez les paramètres dans le dashboard</span>
              </li>
              <li className="flex items-start">
                <CheckCircle className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" />
                <span>Consultez les statistiques d'utilisation</span>
              </li>
            </ul>
          </div>
        </div>
      ),
    },
  ];

  const getInstallationCode = () => {
    return `<!-- Luneo Widget -->
<script src="https://cdn.luneo.app/widget/luneo-widget.js"></script>
<script>
  LuneoWidget.init({
    shop: '${shopDomain}',
    tokenUrl: 'https://api.luneo.app/api/v1/embed/token',
    container: '#luneo-widget',
    onReady: () => console.log('Widget ready!'),
    onError: (err) => console.error('Error:', err),
  });
</script>`;
  };

  const currentStepIndex = steps.findIndex((s) => s.id === currentStep);
  const currentStepData = steps[currentStepIndex];

  const handleNext = () => {
    if (currentStepIndex < steps.length - 1) {
      const nextStep = steps[currentStepIndex + 1].id;
      setCurrentStep(nextStep);
      setCompletedSteps((prev) => new Set([...prev, currentStep]));
      onStepComplete?.(currentStep);
    } else {
      handleComplete();
    }
  };

  const handlePrevious = () => {
    if (currentStepIndex > 0) {
      const prevStep = steps[currentStepIndex - 1].id;
      setCurrentStep(prevStep);
    }
  };

  const handleComplete = () => {
    setCompletedSteps((prev) => new Set([...prev, currentStep]));
    onStepComplete?.(currentStep);
    setTimeout(() => {
      onClose();
    }, 1500);
  };

  const handleSkip = () => {
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            handleSkip();
          }
        }}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className={cn(
            'bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col',
            className
          )}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6 text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                  {currentStepData.icon}
                </div>
                <div>
                  <h2 className="text-xl font-bold">{currentStepData.title}</h2>
                  <p className="text-blue-100 text-sm">{currentStepData.description}</p>
                </div>
              </div>
              <button
                onClick={handleSkip}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                aria-label="Fermer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Progress Bar */}
            <div className="mt-4">
              <div className="flex items-center justify-between mb-2 text-xs text-blue-100">
                <span>Étape {currentStepIndex + 1} sur {steps.length}</span>
                <span>{Math.round(((currentStepIndex + 1) / steps.length) * 100)}%</span>
              </div>
              <div className="w-full bg-white/20 rounded-full h-2">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${((currentStepIndex + 1) / steps.length) * 100}%` }}
                  className="bg-white h-2 rounded-full"
                />
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
              >
                {currentStepData.content}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Footer */}
          <div className="border-t border-gray-200 p-6 bg-gray-50">
            <div className="flex items-center justify-between">
              <button
                onClick={handleSkip}
                className="text-gray-600 hover:text-gray-900 text-sm font-medium"
              >
                Passer
              </button>
              <div className="flex items-center space-x-3">
                {currentStepIndex > 0 && (
                  <button
                    onClick={handlePrevious}
                    className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Précédent
                  </button>
                )}
                <button
                  onClick={currentStep === 'complete' ? handleComplete : handleNext}
                  className="px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-colors font-medium"
                >
                  {currentStep === 'complete' ? 'Terminer' : 'Suivant'}
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

interface PermissionItemProps {
  title: string;
  description: string;
  required: boolean;
  status: 'configured' | 'pending' | 'optional';
}

const PermissionItem: React.FC<PermissionItemProps> = ({ title, description, required, status }) => {
  return (
    <div className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
      <div className="flex-shrink-0 mt-0.5">
        {status === 'configured' ? (
          <CheckCircle className="w-5 h-5 text-green-600" />
        ) : status === 'pending' ? (
          <div className="w-5 h-5 border-2 border-yellow-600 border-t-transparent rounded-full animate-spin" />
        ) : (
          <Shield className="w-5 h-5 text-gray-400" />
        )}
      </div>
      <div className="flex-1">
        <div className="flex items-center space-x-2">
          <h4 className="font-medium text-gray-900">{title}</h4>
          {required && (
            <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded">Requis</span>
          )}
          {!required && (
            <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">Optionnel</span>
          )}
        </div>
        <p className="text-sm text-gray-600 mt-1">{description}</p>
      </div>
    </div>
  );
};

interface TestChecklistItemProps {
  label: string;
  checked: boolean;
}

const TestChecklistItem: React.FC<TestChecklistItemProps> = ({ label, checked }) => {
  return (
    <label className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg border border-gray-200 cursor-pointer hover:bg-gray-100 transition-colors">
      <input
        type="checkbox"
        checked={checked}
        onChange={() => {}}
        className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
      />
      <span className="text-sm text-gray-700">{label}</span>
    </label>
  );
};
