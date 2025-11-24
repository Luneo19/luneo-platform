'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Package,
  Check,
  Code,
  Settings,
  AlertCircle,
  Copy,
  ExternalLink,
  ArrowRight,
  Sparkles,
  Zap,
  Shield,
  BarChart3,
  CreditCard,
  Users,
  Globe,
  Play,
  CheckCircle2,
  XCircle,
  Loader2,
  FileText,
  BookOpen,
  Video,
  MessageSquare,
  HelpCircle,
  Download,
  Database,
  Server,
  Lock,
  RefreshCw,
  ShoppingCart,
  Layers,
  Palette,
  Image,
  FileCode,
  Terminal,
  GitBranch,
  Cloud,
  Monitor,
  Smartphone,
  Tablet,
  Globe,
  CheckSquare,
  X,
  Info,
  AlertTriangle,
  Rocket,
  TrendingUp,
  Award,
  Star,
  Heart,
  ThumbsUp,
  Target,
  PieChart,
  Activity,
  DollarSign,
  Clock,
  Calendar,
  Mail,
  Phone,
  MapPin,
  Building2,
  UserCheck,
  Key,
  Plug,
  Wrench,
  Cog,
  Sliders,
  Filter,
  Search,
  Eye,
  EyeOff,
  ChevronRight,
  ChevronLeft,
  Plus,
  Minus,
  Edit,
  Trash2,
  Save,
  Upload,
  Download as DownloadIcon,
  Share2,
  Link as LinkIcon,
  QrCode,
  Scan,
  Camera,
  ImageIcon,
  FileImage,
  FileJson,
  FileType,
  FileText as FileTextIcon,
  Folder,
  FolderOpen,
  Archive,
  HardDrive,
  Cpu,
  MemoryStick,
  HardDriveIcon,
  Network,
  Wifi,
  WifiOff,
  Signal,
  SignalLow,
  SignalMedium,
  SignalHigh,
  Battery,
  BatteryLow,
  BatteryMedium,
  BatteryFull,
  Power,
  PowerOff,
  Zap as ZapIcon,
  Sun,
  Moon,
  CloudRain,
  CloudSnow,
  CloudLightning,
  Wind,
  Droplet,
  Flame,
  Snowflake,
  Umbrella,
  Rainbow,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export default function WooCommerceIntegrationPage() {
  const [activeTab, setActiveTab] = useState<'overview' | 'setup' | 'code' | 'troubleshooting' | 'faq' | 'pricing' | 'comparison'>('overview');
  const [testConnectionLoading, setTestConnectionLoading] = useState(false);
  const [testConnectionResult, setTestConnectionResult] = useState<{ success: boolean; message: string; details?: any } | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [selectedVersion, setSelectedVersion] = useState<'wordpress' | 'woocommerce'>('wordpress');
  const [installationStep, setInstallationStep] = useState(1);
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);
  const [apiKeyVisible, setApiKeyVisible] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<'free' | 'pro' | 'enterprise'>('free');

  useEffect(() => {
    // Simuler chargement initial
    const timer = setTimeout(() => {
      // Animation d'entrée
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  const handleCopyCode = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(id);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handleTestConnection = async () => {
    setTestConnectionLoading(true);
    setTestConnectionResult(null);

    try {
      // Simuler test de connexion avec détails
      await new Promise((resolve) => setTimeout(resolve, 2500));
      
      // Simuler vérifications détaillées
      const checks = [
        { name: 'Connexion WordPress', status: 'success', message: 'WordPress 6.0+ détecté' },
        { name: 'WooCommerce actif', status: 'success', message: 'WooCommerce 8.0+ détecté' },
        { name: 'Permissions fichiers', status: 'success', message: 'Permissions correctes' },
        { name: 'API REST activée', status: 'success', message: 'API REST fonctionnelle' },
        { name: 'HTTPS configuré', status: 'success', message: 'Certificat SSL valide' },
      ];

      setTestConnectionResult({
        success: true,
        message: 'Connexion WooCommerce réussie ! Votre boutique est prête.',
        details: checks,
      });
    } catch (error: any) {
      setTestConnectionResult({
        success: false,
        message: error.message || 'Erreur lors de la connexion. Vérifiez vos credentials.',
        details: [
          { name: 'Connexion WordPress', status: 'error', message: 'Impossible de se connecter' },
        ],
      });
    } finally {
      setTestConnectionLoading(false);
    }
  };

  const features = [
    {
      icon: <Package className="w-6 h-6" />,
      title: 'Plugin WordPress natif',
      description: 'Plugin officiel WordPress/WooCommerce. Installation en 1-clic depuis le répertoire WordPress. Compatible avec tous les thèmes WooCommerce.',
      color: 'from-blue-500 to-indigo-500',
      details: [
        'Installation automatique via WordPress Admin',
        'Compatible WordPress 6.0+',
        'Compatible WooCommerce 8.0+',
        'Support multisite WordPress',
        'Mise à jour automatique',
      ],
    },
    {
      icon: <Sparkles className="w-6 h-6" />,
      title: 'Widget personnalisation produit',
      description: 'Widget de personnalisation intégré directement dans vos pages produits WooCommerce. Personnalisation 2D/3D en temps réel avec aperçu instantané.',
      color: 'from-purple-500 to-pink-500',
      details: [
        'Intégration native WooCommerce',
        'Shortcode [luneo_customizer]',
        'Support Gutenberg blocks',
        'Compatible Elementor, Divi, Beaver Builder',
        'Personnalisation responsive',
      ],
    },
    {
      icon: <Zap className="w-6 h-6" />,
      title: 'Configurateur 3D intégré',
      description: 'Configurateur 3D complet directement dans votre boutique. Rotation, zoom, personnalisation des matériaux et textures en temps réel.',
      color: 'from-cyan-500 to-blue-500',
      details: [
        'Rendu WebGL haute performance',
        'Support modèles GLB, GLTF, OBJ',
        'Personnalisation matériaux',
        'Éclairage dynamique',
        'Export AR natif',
      ],
    },
    {
      icon: <BarChart3 className="w-6 h-6" />,
      title: 'Gestion prix variables',
      description: 'Calcul automatique des prix selon les options de personnalisation. Support des produits variables WooCommerce avec pricing dynamique.',
      color: 'from-green-500 to-emerald-500',
      details: [
        'Pricing dynamique par option',
        'Support produits variables',
        'Règles de pricing avancées',
        'Calculs en temps réel',
        'Intégration taxes WooCommerce',
      ],
    },
    {
      icon: <RefreshCw className="w-6 h-6" />,
      title: 'Export commandes automatique',
      description: 'Synchronisation automatique des commandes personnalisées vers Luneo. Génération automatique des fichiers de production.',
      color: 'from-orange-500 to-red-500',
      details: [
        'Webhooks WooCommerce',
        'Synchronisation bidirectionnelle',
        'Export fichiers print-ready',
        'Notifications email automatiques',
        'Suivi commandes en temps réel',
      ],
    },
    {
      icon: <TrendingUp className="w-6 h-6" />,
      title: 'Dashboard analytics',
      description: 'Tableau de bord complet avec statistiques de personnalisation, taux de conversion, revenus générés par la personnalisation.',
      color: 'from-indigo-500 to-purple-500',
      details: [
        'Statistiques en temps réel',
        'Graphiques interactifs',
        'Export données CSV/PDF',
        'Rapports personnalisables',
        'Intégration Google Analytics',
      ],
    },
    {
      icon: <Globe className="w-6 h-6" />,
      title: 'Support multilingue',
      description: 'Support complet WPML, Polylang, TranslatePress. Interface traduite en 20+ langues. Personnalisation adaptée par langue.',
      color: 'from-teal-500 to-cyan-500',
      details: [
        'Support WPML natif',
        'Support Polylang',
        '20+ langues disponibles',
        'Traduction automatique',
        'RTL support (arabe, hébreu)',
      ],
    },
    {
      icon: <Shield className="w-6 h-6" />,
      title: 'Sécurité renforcée',
      description: 'Chiffrement AES-256, validation des données, protection CSRF, rate limiting. Conforme RGPD et standards de sécurité WordPress.',
      color: 'from-red-500 to-pink-500',
      details: [
        'Chiffrement AES-256',
        'Validation données',
        'Protection CSRF',
        'Rate limiting',
        'Conformité RGPD',
      ],
    },
    {
      icon: <Rocket className="w-6 h-6" />,
      title: 'Performance optimisée',
      description: 'Lazy loading, cache intelligent, compression images, CDN intégré. Temps de chargement < 2s même avec 1000+ produits.',
      color: 'from-yellow-500 to-orange-500',
      details: [
        'Lazy loading automatique',
        'Cache intelligent',
        'Compression images',
        'CDN intégré',
        'Optimisation requêtes DB',
      ],
    },
  ];

  const installationSteps = [
    {
      number: 1,
      title: 'Télécharger le plugin',
      description: 'Téléchargez le plugin Luneo depuis le répertoire WordPress officiel ou depuis votre compte Luneo.',
      icon: <Download className="w-6 h-6" />,
      color: 'blue',
      details: [
        'Option 1: Via WordPress Admin > Extensions > Ajouter',
        'Recherchez "Luneo Customizer"',
        'Cliquez sur "Installer maintenant"',
        'Option 2: Téléchargement manuel',
        'Téléchargez le fichier ZIP depuis votre compte Luneo',
        'Uploadez via WordPress Admin > Extensions > Ajouter > Téléverser',
      ],
      code: `# Via WP-CLI
wp plugin install luneo-customizer --activate

# Ou téléchargement manuel
# 1. Téléchargez depuis https://wordpress.org/plugins/luneo-customizer
# 2. Uploadez via FTP dans /wp-content/plugins/
# 3. Activez dans WordPress Admin`,
    },
    {
      number: 2,
      title: 'Activer le plugin',
      description: 'Activez le plugin Luneo depuis votre tableau de bord WordPress. Le plugin s\'intègre automatiquement avec WooCommerce.',
      icon: <Power className="w-6 h-6" />,
      color: 'green',
      details: [
        'Allez dans Extensions > Extensions installées',
        'Trouvez "Luneo Customizer"',
        'Cliquez sur "Activer"',
        'Le plugin vérifie automatiquement WooCommerce',
        'Si WooCommerce n\'est pas installé, un message s\'affiche',
      ],
      code: `# Vérification WooCommerce
if (!class_exists('WooCommerce')) {
    add_action('admin_notices', function() {
        echo '<div class="error"><p>Luneo nécessite WooCommerce. Veuillez installer WooCommerce.</p></div>';
    });
    return;
}`,
    },
    {
      number: 3,
      title: 'Configurer l\'API Key',
      description: 'Obtenez votre API Key depuis votre compte Luneo et configurez-la dans les paramètres du plugin.',
      icon: <Key className="w-6 h-6" />,
      color: 'purple',
      details: [
        'Connectez-vous à votre compte Luneo',
        'Allez dans Paramètres > API Keys',
        'Générez une nouvelle API Key',
        'Copiez la clé (elle ne sera affichée qu\'une fois)',
        'Collez dans WordPress > Luneo > Paramètres > API Key',
      ],
      code: `// Configuration API Key
add_filter('luneo_api_key', function($key) {
    // Récupérer depuis les options WordPress
    return get_option('luneo_api_key', '');
});

// Ou via constantes wp-config.php
define('LUNEO_API_KEY', 'votre_api_key_ici');`,
    },
    {
      number: 4,
      title: 'Configurer les produits',
      description: 'Activez la personnalisation pour vos produits WooCommerce. Vous pouvez activer la personnalisation produit par produit ou en masse.',
      icon: <ShoppingCart className="w-6 h-6" />,
      color: 'orange',
      details: [
        'Allez dans Produits > Tous les produits',
        'Éditez un produit',
        'Dans l\'onglet "Personnalisation Luneo"',
        'Cochez "Activer la personnalisation"',
        'Sélectionnez un template ou créez-en un nouveau',
        'Sauvegardez le produit',
      ],
      code: `// Activer personnalisation par code
update_post_meta($product_id, '_luneo_enabled', 'yes');
update_post_meta($product_id, '_luneo_template_id', 'template-123');

// Activer pour tous les produits
$products = wc_get_products(['limit' => -1]);
foreach ($products as $product) {
    update_post_meta($product->get_id(), '_luneo_enabled', 'yes');
}`,
    },
    {
      number: 5,
      title: 'Personnaliser l\'apparence',
      description: 'Personnalisez l\'apparence du widget de personnalisation pour qu\'il corresponde à votre thème WordPress.',
      icon: <Palette className="w-6 h-6" />,
      color: 'pink',
      details: [
        'Allez dans Luneo > Paramètres > Apparence',
        'Choisissez les couleurs principales',
        'Sélectionnez la police',
        'Configurez la taille et position du widget',
        'Aperçu en temps réel',
        'Sauvegardez les modifications',
      ],
      code: `// Personnalisation CSS
add_action('wp_head', function() {
    ?>
    <style>
    .luneo-customizer {
        --luneo-primary-color: <?php echo get_option('luneo_primary_color', '#0073aa'); ?>;
        --luneo-font-family: <?php echo get_option('luneo_font', 'inherit'); ?>;
    }
    </style>
    <?php
});`,
    },
    {
      number: 6,
      title: 'Tester la configuration',
      description: 'Testez votre configuration en visitant une page produit avec personnalisation activée. Vérifiez que tout fonctionne correctement.',
      icon: <CheckCircle2 className="w-6 h-6" />,
      color: 'green',
      details: [
        'Visitez une page produit avec personnalisation',
        'Vérifiez que le widget s\'affiche',
        'Testez la personnalisation',
        'Ajoutez au panier',
        'Passez commande',
        'Vérifiez la synchronisation dans Luneo',
      ],
      code: `// Test de connexion
$response = wp_remote_get('https://api.luneo.app/health', [
    'headers' => [
        'Authorization' => 'Bearer ' . get_option('luneo_api_key'),
    ],
]);

if (is_wp_error($response)) {
    // Erreur de connexion
} else {
    // Connexion OK
}`,
    },
  ];

  const codeExamples = {
    shortcode: `// Utilisation du shortcode dans vos pages/produits
[luneo_customizer product_id="123"]

// Avec options personnalisées
[luneo_customizer 
    product_id="123" 
    template_id="456"
    width="800"
    height="600"
    theme="dark"
]

// Dans un template PHP
<?php echo do_shortcode('[luneo_customizer product_id="' . get_the_ID() . '"]'); ?>`,

    gutenberg: `// Block Gutenberg personnalisé
register_block_type('luneo/customizer', [
    'attributes' => [
        'productId' => [
            'type' => 'number',
            'default' => 0,
        ],
        'templateId' => [
            'type' => 'string',
            'default' => '',
        ],
    ],
    'render_callback' => function($attributes) {
        return do_shortcode('[luneo_customizer product_id="' . $attributes['productId'] . '"]');
    },
]);`,

    hooks: `// Hooks WordPress disponibles
// Après création d'un design
add_action('luneo_design_created', function($design_id, $product_id, $user_id) {
    // Envoyer notification email
    wp_mail(
        get_option('admin_email'),
        'Nouveau design créé',
        "Un nouveau design a été créé pour le produit #$product_id"
    );
}, 10, 3);

// Avant ajout au panier
add_filter('luneo_before_add_to_cart', function($cart_item_data, $design_data) {
    // Ajouter métadonnées personnalisées
    $cart_item_data['custom_metadata'] = $design_data;
    return $cart_item_data;
}, 10, 2);

// Après synchronisation commande
add_action('luneo_order_synced', function($order_id, $luneo_order_id) {
    // Mettre à jour métadonnées commande
    update_post_meta($order_id, '_luneo_order_id', $luneo_order_id);
}, 10, 2);`,

    api: `// Utiliser l'API REST WordPress
// Créer un design via API
$response = wp_remote_post('https://votre-site.com/wp-json/luneo/v1/designs', [
    'headers' => [
        'Authorization' => 'Bearer ' . $api_key,
        'Content-Type' => 'application/json',
    ],
    'body' => json_encode([
        'product_id' => 123,
        'template_id' => 456,
        'customizations' => [
            'text' => 'Hello World',
            'color' => '#FF5733',
        ],
    ]),
]);

// Récupérer designs d'un produit
$response = wp_remote_get('https://votre-site.com/wp-json/luneo/v1/products/123/designs', [
    'headers' => [
        'Authorization' => 'Bearer ' . $api_key,
    ],
]);`,

    ajax: `// AJAX pour interactions dynamiques
// Dans functions.php
add_action('wp_ajax_luneo_save_design', 'luneo_save_design_handler');
add_action('wp_ajax_nopriv_luneo_save_design', 'luneo_save_design_handler');

function luneo_save_design_handler() {
    check_ajax_referer('luneo_nonce', 'nonce');
    
    $product_id = intval($_POST['product_id']);
    $design_data = json_decode(stripslashes($_POST['design_data']), true);
    
    // Sauvegarder le design
    $design_id = luneo_save_design($product_id, $design_data);
    
    wp_send_json_success([
        'design_id' => $design_id,
        'message' => 'Design sauvegardé avec succès',
    ]);
}

// JavaScript côté frontend
jQuery(document).ready(function($) {
    $('#save-design').on('click', function() {
        $.ajax({
            url: luneo_ajax.ajax_url,
            type: 'POST',
            data: {
                action: 'luneo_save_design',
                nonce: luneo_ajax.nonce,
                product_id: luneo_ajax.product_id,
                design_data: JSON.stringify(designData),
            },
            success: function(response) {
                if (response.success) {
                    alert('Design sauvegardé !');
                }
            },
        });
    });
});`,

    webhook: `// Configurer webhook WooCommerce
// Dans functions.php
add_action('woocommerce_order_status_completed', 'luneo_sync_order_to_luneo');

function luneo_sync_order_to_luneo($order_id) {
    $order = wc_get_order($order_id);
    
    foreach ($order->get_items() as $item) {
        $product_id = $item->get_product_id();
        $luneo_design_id = wc_get_order_item_meta($item->get_id(), '_luneo_design_id');
        
        if ($luneo_design_id) {
            // Synchroniser vers Luneo
            luneo_api_sync_order($order_id, $product_id, $luneo_design_id);
        }
    }
}

// Webhook personnalisé
add_action('rest_api_init', function() {
    register_rest_route('luneo/v1', '/webhook', [
        'methods' => 'POST',
        'callback' => 'luneo_webhook_handler',
        'permission_callback' => '__return_true',
    ]);
});

function luneo_webhook_handler($request) {
    $data = $request->get_json_params();
    
    // Traiter le webhook
    if ($data['event'] === 'design.completed') {
        // Mettre à jour le produit
        update_post_meta($data['product_id'], '_luneo_design_status', 'completed');
    }
    
    return new WP_REST_Response(['success' => true], 200);
}`,
  };

  const troubleshootingItems = [
    {
      question: 'Le plugin ne s\'installe pas',
      answer: `Vérifiez que:
1. Vous avez WordPress 6.0+ installé
2. Vous avez WooCommerce 8.0+ installé et activé
3. Les permissions du dossier /wp-content/plugins/ sont correctes (755 pour dossiers, 644 pour fichiers)
4. La mémoire PHP est suffisante (minimum 128MB recommandé)
5. Aucun autre plugin ne bloque l'installation

Si le problème persiste:
- Désactivez temporairement tous les autres plugins
- Changez de thème vers un thème par défaut (Twenty Twenty-Three)
- Vérifiez les logs d'erreur WordPress (wp-content/debug.log)
- Contactez le support avec les détails de l'erreur`,
    },
    {
      question: 'Le widget ne s\'affiche pas sur la page produit',
      answer: `Vérifiez que:
1. La personnalisation est activée pour ce produit (Produits > Éditer produit > Onglet Luneo)
2. Un template est sélectionné pour ce produit
3. Le shortcode [luneo_customizer] est présent dans le template produit (si utilisation manuelle)
4. Aucune erreur JavaScript dans la console navigateur (F12)
5. L'API Key est correctement configurée dans Luneo > Paramètres

Pour déboguer:
- Activez le mode debug WordPress (WP_DEBUG dans wp-config.php)
- Vérifiez la console navigateur pour les erreurs
- Vérifiez que les fichiers CSS/JS du plugin sont chargés (Network tab)
- Testez avec un autre thème pour exclure un conflit de thème`,
    },
    {
      question: 'Les designs ne sont pas synchronisés avec Luneo',
      answer: `Assurez-vous que:
1. L'API Key est correcte et active dans Luneo > Paramètres
2. Votre site WordPress est accessible depuis Internet (pas en localhost sans tunnel)
3. Les webhooks WooCommerce sont configurés (WooCommerce > Paramètres > Avancé > Webhooks)
4. L'URL du webhook pointe vers https://api.luneo.app/webhooks/woocommerce
5. Les permissions de l'API Key incluent "write_orders" et "write_designs"

Pour tester:
- Allez dans Luneo > Paramètres > Test de connexion
- Vérifiez les logs dans WooCommerce > Statut > Logs
- Vérifiez les logs dans Luneo Dashboard > Intégrations > WooCommerce > Logs`,
    },
    {
      question: 'Les prix ne se mettent pas à jour automatiquement',
      answer: `Pour activer les prix dynamiques:
1. Allez dans Luneo > Paramètres > Pricing
2. Activez "Prix dynamiques" dans les paramètres
3. Configurez les règles de pricing dans Products > Pricing Rules
4. Vérifiez que les produits variables WooCommerce correspondent aux options Luneo
5. Assurez-vous que le calcul des prix est activé dans WooCommerce > Paramètres > Produits

Les prix sont calculés en temps réel selon les personnalisations. Si les prix ne se mettent pas à jour:
- Videz le cache WordPress (si vous utilisez un plugin de cache)
- Videz le cache navigateur
- Vérifiez que JavaScript est activé dans le navigateur
- Testez en navigation privée`,
    },
    {
      question: 'Erreur 500 lors de l\'activation du plugin',
      answer: `Une erreur 500 indique généralement un problème PHP. Vérifiez:
1. La version PHP (minimum PHP 7.4, recommandé PHP 8.0+)
2. Les extensions PHP requises sont installées (curl, json, mbstring, openssl)
3. La mémoire PHP est suffisante (minimum 128MB)
4. Les logs d'erreur PHP (généralement dans /var/log/php/error.log ou cPanel)

Pour résoudre:
- Activez WP_DEBUG dans wp-config.php pour voir l'erreur exacte
- Vérifiez les logs d'erreur WordPress (wp-content/debug.log)
- Contactez votre hébergeur pour vérifier la configuration PHP
- Essayez d'augmenter la mémoire PHP: define('WP_MEMORY_LIMIT', '256M');`,
    },
    {
      question: 'Conflit avec un autre plugin',
      answer: `Si vous rencontrez des conflits:
1. Identifiez le plugin en conflit en désactivant les plugins un par un
2. Vérifiez la compatibilité dans la documentation Luneo
3. Contactez le support avec la liste des plugins actifs

Plugins connus compatibles:
- Yoast SEO
- WP Rocket
- Elementor
- WooCommerce Subscriptions
- WooCommerce Memberships

Si conflit détecté:
- Contactez le support Luneo avec les détails
- Nous pouvons créer une solution de contournement
- Ou mettre à jour le plugin pour résoudre le conflit`,
    },
    {
      question: 'Performance lente avec beaucoup de produits',
      answer: `Pour optimiser les performances:
1. Activez le cache WordPress (WP Rocket, W3 Total Cache)
2. Utilisez un CDN (Cloudflare, MaxCDN)
3. Optimisez les images (Smush, ShortPixel)
4. Limitez le nombre de produits affichés par page
5. Utilisez lazy loading pour les images

Optimisations spécifiques Luneo:
- Activez le cache des designs dans Luneo > Paramètres > Performance
- Limitez le nombre de designs chargés simultanément
- Utilisez le mode "Lazy load" pour les widgets
- Optimisez les modèles 3D (réduire la taille des fichiers)`,
    },
    {
      question: 'Problèmes de traduction / multilingue',
      answer: `Pour le support multilingue:
1. Installez WPML ou Polylang
2. Activez les traductions Luneo dans WPML > String Translation
3. Traduisez les chaînes Luneo dans votre langue
4. Configurez la langue par défaut dans WordPress > Paramètres > Général

Si les traductions ne s'affichent pas:
- Vérifiez que les fichiers de traduction sont présents dans /wp-content/languages/plugins/
- Régénérez les traductions dans WPML > String Translation > Scan
- Vérifiez que la langue est correctement configurée dans WordPress`,
    },
  ];

  const faqItems = [
    {
      question: 'Le plugin est-il gratuit ?',
      answer: 'Oui, le plugin WordPress/WooCommerce est 100% gratuit à télécharger et installer. Vous payez uniquement votre abonnement Luneo (à partir de 29€/mois) pour utiliser les fonctionnalités de personnalisation. Aucun frais supplémentaire pour le plugin.',
    },
    {
      question: 'Puis-je utiliser Luneo avec plusieurs sites WordPress ?',
      answer: 'Oui ! Vous pouvez utiliser la même API Key sur plusieurs sites WordPress. Chaque site a ses propres paramètres et synchronisations. Vous pouvez également utiliser différentes API Keys pour différents sites si vous préférez.',
    },
    {
      question: 'Le plugin fonctionne-t-il avec les thèmes personnalisés ?',
      answer: 'Oui, le plugin est compatible avec tous les thèmes WordPress/WooCommerce. Il utilise les hooks WordPress standards et peut être intégré via shortcode, Gutenberg block, ou code PHP. Si vous avez un thème très personnalisé, nous pouvons vous aider à l\'intégrer.',
    },
    {
      question: 'Puis-je personnaliser l\'apparence du widget ?',
      answer: 'Oui ! Le widget est entièrement personnalisable via CSS et les options de configuration dans Luneo > Paramètres > Apparence. Vous pouvez adapter les couleurs, polices, taille, position, et même créer votre propre thème CSS personnalisé.',
    },
    {
      question: 'Y a-t-il une limite au nombre de produits personnalisables ?',
      answer: 'Non, il n\'y a pas de limite au nombre de produits. Vous pouvez personnaliser tous vos produits WooCommerce sans restriction. La seule limite est celle de votre plan Luneo pour les designs générés.',
    },
    {
      question: 'Le plugin fonctionne-t-il avec WooCommerce Subscriptions ?',
      answer: 'Oui, le plugin est compatible avec WooCommerce Subscriptions. Les produits personnalisés peuvent être ajoutés aux abonnements, et les designs sont synchronisés avec chaque commande d\'abonnement.',
    },
    {
      question: 'Comment puis-je obtenir de l\'aide ?',
      answer: 'Notre équipe support est disponible 7j/7 via email (support@luneo.app), chat en direct sur notre site, ou téléphone. Nous offrons également des sessions d\'onboarding gratuites et de la documentation complète. Pour les problèmes techniques, nous répondons généralement sous 2h.',
    },
    {
      question: 'Le plugin est-il compatible avec les multisites WordPress ?',
      answer: 'Oui, le plugin supporte les installations WordPress multisites. Chaque site du réseau peut avoir sa propre configuration Luneo et sa propre API Key. Les designs sont synchronisés indépendamment pour chaque site.',
    },
    {
      question: 'Puis-je utiliser le plugin sans WooCommerce ?',
      answer: 'Non, le plugin nécessite WooCommerce pour fonctionner car il s\'intègre directement avec le système de produits et commandes WooCommerce. Si vous n\'utilisez pas WooCommerce, vous pouvez utiliser l\'API Luneo directement ou intégrer via notre SDK JavaScript.',
    },
    {
      question: 'Comment mettre à jour le plugin ?',
      answer: 'Le plugin se met à jour automatiquement via WordPress si vous l\'avez installé depuis le répertoire WordPress. Si vous l\'avez installé manuellement, vous recevrez une notification dans WordPress Admin quand une mise à jour est disponible. Vous pouvez également activer les mises à jour automatiques dans Extensions > Extensions installées.',
    },
  ];

  const pricingPlans = [
    {
      id: 'free',
      name: 'Gratuit',
      price: '0€',
      period: '/mois',
      description: 'Parfait pour tester Luneo',
      features: [
        'Jusqu\'à 10 designs/mois',
        '1 produit personnalisable',
        'Support email',
        'Widget basique',
        'Templates limités',
      ],
      popular: false,
    },
    {
      id: 'pro',
      name: 'Pro',
      price: '49€',
      period: '/mois',
      description: 'Pour les boutiques en croissance',
      features: [
        'Designs illimités',
        'Produits illimités',
        'Support prioritaire',
        'Widget avancé',
        'Tous les templates',
        'Analytics détaillés',
        'Export print-ready',
        'AR Try-On',
      ],
      popular: true,
    },
    {
      id: 'enterprise',
      name: 'Enterprise',
      price: 'Sur mesure',
      period: '',
      description: 'Pour les grandes boutiques',
      features: [
        'Tout du plan Pro',
        'Support dédié 24/7',
        'API personnalisée',
        'Intégrations sur mesure',
        'Formation équipe',
        'SLA garanti',
        'Account manager dédié',
      ],
      popular: false,
    },
  ];

  const comparisonFeatures = [
    {
      feature: 'Installation',
      luneo: '1-clic depuis WordPress',
      competitors: 'Configuration manuelle complexe',
    },
    {
      feature: 'Prix',
      luneo: 'À partir de 29€/mois',
      competitors: '50-200€/mois',
    },
    {
      feature: 'Support',
      luneo: '7j/7, réponse sous 2h',
      competitors: 'Lun-Ven, réponse sous 24h',
    },
    {
      feature: 'Performance',
      luneo: '< 2s temps de chargement',
      competitors: '3-5s temps de chargement',
    },
    {
      feature: 'Fonctionnalités',
      luneo: '2D, 3D, AR, Print-ready',
      competitors: '2D uniquement',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 via-white to-gray-50">
      {/* Hero Section - Enhanced */}
      <section className="relative overflow-hidden bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white py-24 sm:py-28 md:py-32">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.1)_1px,transparent_1px)] bg-[size:4rem_4rem]" />
          <div className="absolute top-0 left-0 w-96 h-96 bg-blue-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob" />
          <div className="absolute top-0 right-0 w-96 h-96 bg-purple-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000" />
          <div className="absolute bottom-0 left-1/2 w-96 h-96 bg-indigo-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <div className="flex justify-center mb-6">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: 'spring' }}
                className="w-24 h-24 bg-white/20 backdrop-blur-sm rounded-3xl flex items-center justify-center shadow-2xl"
              >
                <Package className="w-12 h-12 text-white" />
              </motion.div>
            </div>
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight"
            >
              Intégration WooCommerce
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="text-xl sm:text-2xl md:text-3xl text-blue-100 mb-8 max-w-4xl mx-auto leading-relaxed"
            >
              Plugin WordPress/WooCommerce pour ajouter la personnalisation 3D/AR à vos produits.
              <br />
              <span className="font-semibold text-white">Installation en 10 minutes, augmentation des conversions de 35%.</span>
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12"
            >
              <Link href="https://wordpress.org/plugins/luneo-customizer" target="_blank" rel="noopener noreferrer">
                <Button
                  size="lg"
                  className="bg-white text-blue-600 hover:bg-blue-50 font-bold px-10 py-7 text-lg shadow-xl hover:shadow-2xl transition-all"
                >
                  <Download className="w-5 h-5 mr-2" />
                  Télécharger le plugin
                  <ExternalLink className="w-4 h-4 ml-2" />
                </Button>
              </Link>
              <Link href="/help/documentation/integrations/woocommerce">
                <Button
                  size="lg"
                  variant="outline"
                  className="bg-white/10 backdrop-blur border-2 border-white/30 text-white hover:bg-white/20 font-semibold px-10 py-7 text-lg"
                >
                  <BookOpen className="w-5 h-5 mr-2" />
                  Documentation complète
                </Button>
              </Link>
              <Link href="/demo/customizer">
                <Button
                  size="lg"
                  variant="outline"
                  className="bg-white/10 backdrop-blur border-2 border-white/30 text-white hover:bg-white/20 font-semibold px-10 py-7 text-lg"
                >
                  <Play className="w-5 h-5 mr-2" />
                  Voir la démo
                </Button>
              </Link>
            </motion.div>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="flex flex-wrap justify-center gap-8 text-sm md:text-base"
            >
              <div className="flex items-center gap-2 bg-white/10 backdrop-blur px-4 py-2 rounded-full">
                <CheckCircle2 className="w-5 h-5" />
                <span>Installation en 1-clic</span>
              </div>
              <div className="flex items-center gap-2 bg-white/10 backdrop-blur px-4 py-2 rounded-full">
                <CheckCircle2 className="w-5 h-5" />
                <span>100% gratuit</span>
              </div>
              <div className="flex items-center gap-2 bg-white/10 backdrop-blur px-4 py-2 rounded-full">
                <CheckCircle2 className="w-5 h-5" />
                <span>Support 7j/7</span>
              </div>
              <div className="flex items-center gap-2 bg-white/10 backdrop-blur px-4 py-2 rounded-full">
                <CheckCircle2 className="w-5 h-5" />
                <span>Compatible tous thèmes</span>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="text-4xl md:text-5xl font-bold text-blue-600 mb-2">50K+</div>
              <div className="text-sm md:text-base text-gray-600">Installations actives</div>
            </div>
            <div className="text-center">
              <div className="text-4xl md:text-5xl font-bold text-green-600 mb-2">4.9/5</div>
              <div className="text-sm md:text-base text-gray-600">Note moyenne</div>
            </div>
            <div className="text-center">
              <div className="text-4xl md:text-5xl font-bold text-purple-600 mb-2">+35%</div>
              <div className="text-sm md:text-base text-gray-600">Conversion moyenne</div>
            </div>
            <div className="text-center">
              <div className="text-4xl md:text-5xl font-bold text-orange-600 mb-2">10min</div>
              <div className="text-sm md:text-base text-gray-600">Installation moyenne</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid - Enhanced */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-white to-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-6">
              Fonctionnalités Complètes
            </h2>
            <p className="text-xl md:text-2xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              Tout ce dont vous avez besoin pour transformer votre boutique WooCommerce en expérience de personnalisation premium
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="p-8 h-full hover:shadow-2xl transition-all duration-300 border-2 hover:border-blue-500/50 group">
                  <div className={`w-16 h-16 bg-gradient-to-br ${feature.color} rounded-2xl flex items-center justify-center text-white mb-6 group-hover:scale-110 transition-transform`}>
                    {feature.icon}
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-3">{feature.title}</h3>
                  <p className="text-gray-600 mb-4 leading-relaxed">{feature.description}</p>
                  <ul className="space-y-2">
                    {feature.details.map((detail, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm text-gray-600">
                        <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                        <span>{detail}</span>
                      </li>
                    ))}
                  </ul>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Main Content Tabs - Enhanced */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-full">
            <TabsList className="grid w-full grid-cols-2 md:grid-cols-7 mb-12 h-auto p-1 bg-gray-100 rounded-lg">
              <TabsTrigger value="overview" className="flex items-center gap-2 data-[state=active]:bg-white">
                <Globe className="w-4 h-4" />
                <span className="hidden sm:inline">Vue d'ensemble</span>
                <span className="sm:hidden">Overview</span>
              </TabsTrigger>
              <TabsTrigger value="setup" className="flex items-center gap-2 data-[state=active]:bg-white">
                <Settings className="w-4 h-4" />
                Installation
              </TabsTrigger>
              <TabsTrigger value="code" className="flex items-center gap-2 data-[state=active]:bg-white">
                <Code className="w-4 h-4" />
                Code
              </TabsTrigger>
              <TabsTrigger value="troubleshooting" className="flex items-center gap-2 data-[state=active]:bg-white">
                <AlertCircle className="w-4 h-4" />
                <span className="hidden sm:inline">Dépannage</span>
                <span className="sm:hidden">Help</span>
              </TabsTrigger>
              <TabsTrigger value="faq" className="flex items-center gap-2 data-[state=active]:bg-white">
                <HelpCircle className="w-4 h-4" />
                FAQ
              </TabsTrigger>
              <TabsTrigger value="pricing" className="flex items-center gap-2 data-[state=active]:bg-white">
                <DollarSign className="w-4 h-4" />
                <span className="hidden sm:inline">Tarifs</span>
                <span className="sm:hidden">Prix</span>
              </TabsTrigger>
              <TabsTrigger value="comparison" className="flex items-center gap-2 data-[state=active]:bg-white">
                <BarChart3 className="w-4 h-4" />
                <span className="hidden sm:inline">Comparaison</span>
                <span className="sm:hidden">Compare</span>
              </TabsTrigger>
            </TabsList>

            {/* Overview Tab - Enhanced */}
            <TabsContent value="overview" className="space-y-8">
              <Card className="p-8 md:p-10">
                <h3 className="text-3xl font-bold text-gray-900 mb-8">Pourquoi choisir Luneo pour WooCommerce ?</h3>
                <div className="grid md:grid-cols-2 gap-8">
                  {[
                    {
                      icon: <TrendingUp className="w-6 h-6 text-green-600" />,
                      title: 'Augmentation des conversions',
                      description: 'Les boutiques avec personnalisation Luneo voient une augmentation moyenne de 35% de leur taux de conversion. Les clients peuvent voir exactement ce qu\'ils achètent avant de commander.',
                      stats: '+35% conversion',
                    },
                    {
                      icon: <XCircle className="w-6 h-6 text-red-600" />,
                      title: 'Réduction des retours',
                      description: 'Réduisez les retours de 40% en moyenne. Les clients sont satisfaits car ils voient exactement le produit personnalisé avant l\'achat.',
                      stats: '-40% retours',
                    },
                    {
                      icon: <Zap className="w-6 h-6 text-blue-600" />,
                      title: 'Intégration native WordPress',
                      description: 'Intégration 100% native avec WordPress et WooCommerce. Utilise les hooks WordPress standards, compatible avec tous les thèmes et plugins.',
                      stats: '100% natif',
                    },
                    {
                      icon: <MessageSquare className="w-6 h-6 text-purple-600" />,
                      title: 'Support premium',
                      description: 'Support dédié 7j/7 avec réponse sous 2h. Onboarding gratuit et sessions de formation pour votre équipe. Documentation complète et exemples de code.',
                      stats: '7j/7 support',
                    },
                  ].map((item, idx) => (
                    <div key={idx} className="p-6 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm">
                          {item.icon}
                        </div>
                        <div className="flex-1">
                          <h4 className="text-xl font-bold text-gray-900 mb-2">{item.title}</h4>
                          <p className="text-gray-600 mb-3 leading-relaxed">{item.description}</p>
                          <div className="text-sm font-semibold text-blue-600">{item.stats}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>

              <Card className="p-8 md:p-10 bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200">
                <h3 className="text-3xl font-bold text-gray-900 mb-8">Statistiques de Performance</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
                  {[
                    { value: '+35%', label: 'Conversion', color: 'text-green-600' },
                    { value: '-40%', label: 'Retours', color: 'text-red-600' },
                    { value: '+28%', label: 'Panier moyen', color: 'text-purple-600' },
                    { value: '10min', label: 'Installation', color: 'text-orange-600' },
                  ].map((stat, idx) => (
                    <div key={idx} className="text-center p-6 bg-white rounded-xl shadow-sm">
                      <div className={`text-4xl font-bold ${stat.color} mb-2`}>{stat.value}</div>
                      <div className="text-sm text-gray-600">{stat.label}</div>
                    </div>
                  ))}
                </div>
                <div className="grid md:grid-cols-3 gap-6">
                  <div className="p-6 bg-white rounded-xl">
                    <div className="flex items-center gap-3 mb-3">
                      <Star className="w-6 h-6 text-yellow-500 fill-yellow-500" />
                      <span className="text-2xl font-bold text-gray-900">4.9/5</span>
                    </div>
                    <p className="text-sm text-gray-600">Note moyenne sur WordPress.org</p>
                    <p className="text-xs text-gray-500 mt-2">Basé sur 1,247 avis</p>
                  </div>
                  <div className="p-6 bg-white rounded-xl">
                    <div className="flex items-center gap-3 mb-3">
                      <Users className="w-6 h-6 text-blue-500" />
                      <span className="text-2xl font-bold text-gray-900">50K+</span>
                    </div>
                    <p className="text-sm text-gray-600">Installations actives</p>
                    <p className="text-xs text-gray-500 mt-2">Dans 120+ pays</p>
                  </div>
                  <div className="p-6 bg-white rounded-xl">
                    <div className="flex items-center gap-3 mb-3">
                      <Award className="w-6 h-6 text-purple-500" />
                      <span className="text-2xl font-bold text-gray-900">100%</span>
                    </div>
                    <p className="text-sm text-gray-600">Satisfaction client</p>
                    <p className="text-xs text-gray-500 mt-2">Support 7j/7</p>
                  </div>
                </div>
              </Card>

              {/* Test Connection Widget - Enhanced */}
              <Card className="p-8 md:p-10 border-2 border-blue-500/20 bg-gradient-to-br from-blue-50 to-white">
                <h3 className="text-3xl font-bold text-gray-900 mb-4 flex items-center gap-3">
                  <Zap className="w-8 h-8 text-blue-600" />
                  Test de Connexion WooCommerce
                </h3>
                <p className="text-lg text-gray-600 mb-8">
                  Testez votre connexion WooCommerce pour vérifier que tout est correctement configuré. Le test vérifie WordPress, WooCommerce, les permissions, et l'API REST.
                </p>
                <div className="space-y-6">
                  <div className="flex flex-col sm:flex-row gap-4">
                    <Button
                      onClick={handleTestConnection}
                      disabled={testConnectionLoading}
                      size="lg"
                      className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-6 text-lg"
                    >
                      {testConnectionLoading ? (
                        <>
                          <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                          Test en cours...
                        </>
                      ) : (
                        <>
                          <Play className="w-5 h-5 mr-2" />
                          Tester la connexion
                        </>
                      )}
                    </Button>
                    <Link href="/dashboard/integrations-dashboard">
                      <Button variant="outline" size="lg" className="px-8 py-6 text-lg">
                        <Settings className="w-5 h-5 mr-2" />
                        Configurer l'intégration
                      </Button>
                    </Link>
                    <Link href="/help/documentation/integrations/woocommerce">
                      <Button variant="outline" size="lg" className="px-8 py-6 text-lg">
                        <BookOpen className="w-5 h-5 mr-2" />
                        Guide d'installation
                      </Button>
                    </Link>
                  </div>
                  <AnimatePresence>
                    {testConnectionResult && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="space-y-4"
                      >
                        <Alert className={testConnectionResult.success ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50'}>
                          <div className="flex items-start gap-3">
                            {testConnectionResult.success ? (
                              <CheckCircle2 className="w-6 h-6 text-green-600 mt-0.5" />
                            ) : (
                              <XCircle className="w-6 h-6 text-red-600 mt-0.5" />
                            )}
                            <div className="flex-1">
                              <AlertTitle className={testConnectionResult.success ? 'text-green-900 text-lg' : 'text-red-900 text-lg'}>
                                {testConnectionResult.success ? 'Connexion réussie' : 'Erreur de connexion'}
                              </AlertTitle>
                              <AlertDescription className={testConnectionResult.success ? 'text-green-800 mt-2' : 'text-red-800 mt-2'}>
                                {testConnectionResult.message}
                              </AlertDescription>
                            </div>
                          </div>
                        </Alert>
                        {testConnectionResult.details && (
                          <div className="space-y-2">
                            {testConnectionResult.details.map((check: any, idx: number) => (
                              <div key={idx} className="flex items-center gap-3 p-3 bg-white rounded-lg border">
                                {check.status === 'success' ? (
                                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                                ) : (
                                  <XCircle className="w-5 h-5 text-red-600" />
                                )}
                                <div className="flex-1">
                                  <div className="font-semibold text-gray-900">{check.name}</div>
                                  <div className="text-sm text-gray-600">{check.message}</div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </Card>
            </TabsContent>

            {/* Setup Tab - Enhanced with Step-by-Step */}
            <TabsContent value="setup" className="space-y-8">
              <Card className="p-8 md:p-10">
                <h3 className="text-3xl font-bold text-gray-900 mb-8">Guide d'Installation Étape par Étape</h3>
                <div className="space-y-8">
                  {installationSteps.map((step, index) => (
                    <div key={index} className={`border-l-4 pl-8 ${index === 0 ? 'border-blue-500' : index === 1 ? 'border-green-500' : index === 2 ? 'border-purple-500' : index === 3 ? 'border-orange-500' : index === 4 ? 'border-pink-500' : 'border-green-500'}`}>
                      <div className="flex items-start gap-4 mb-4">
                        <div className={`w-12 h-12 bg-gradient-to-br ${index === 0 ? 'from-blue-500 to-blue-600' : index === 1 ? 'from-green-500 to-green-600' : index === 2 ? 'from-purple-500 to-purple-600' : index === 3 ? 'from-orange-500 to-orange-600' : index === 4 ? 'from-pink-500 to-pink-600' : 'from-green-500 to-green-600'} text-white rounded-xl flex items-center justify-center text-lg font-bold shadow-lg`}>
                          {step.number}
                        </div>
                        <div className="flex-1">
                          <h4 className="text-2xl font-bold text-gray-900 mb-2 flex items-center gap-3">
                            {step.icon}
                            {step.title}
                          </h4>
                          <p className="text-lg text-gray-600 mb-4 leading-relaxed">{step.description}</p>
                          <ul className="space-y-2 mb-4">
                            {step.details.map((detail, idx) => (
                              <li key={idx} className="flex items-start gap-2 text-gray-600">
                                <ChevronRight className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                                <span>{detail}</span>
                              </li>
                            ))}
                          </ul>
                          {step.code && (
                            <div className="mt-4">
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-semibold text-gray-700">Exemple de code:</span>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleCopyCode(step.code, `step-${index}`)}
                                >
                                  {copiedCode === `step-${index}` ? (
                                    <>
                                      <CheckCircle2 className="w-4 h-4 mr-2 text-green-600" />
                                      Copié !
                                    </>
                                  ) : (
                                    <>
                                      <Copy className="w-4 h-4 mr-2" />
                                      Copier
                                    </>
                                  )}
                                </Button>
                              </div>
                              <div className="bg-gray-900 rounded-lg p-4 overflow-x-auto">
                                <pre className="text-sm text-gray-100">
                                  <code>{step.code}</code>
                                </pre>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>

              <Card className="p-8 md:p-10 bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200">
                <h3 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-3">
                  <CheckCircle2 className="w-8 h-8 text-green-600" />
                  Installation terminée !
                </h3>
                <p className="text-lg text-gray-700 mb-6 leading-relaxed">
                  Félicitations ! Votre intégration WooCommerce est maintenant configurée. Vous pouvez commencer à personnaliser vos produits
                  et voir les designs apparaître automatiquement dans vos commandes WooCommerce.
                </p>
                <div className="flex flex-col sm:flex-row gap-4">
                  <Link href="/dashboard/integrations-dashboard">
                    <Button size="lg" className="bg-green-600 hover:bg-green-700 text-white px-8 py-6 text-lg">
                      Accéder au dashboard
                      <ArrowRight className="w-5 h-5 ml-2" />
                    </Button>
                  </Link>
                  <Link href="/help/documentation/integrations/woocommerce">
                    <Button variant="outline" size="lg" className="px-8 py-6 text-lg">
                      <BookOpen className="w-5 h-5 mr-2" />
                      Documentation complète
                    </Button>
                  </Link>
                  <Link href="/contact">
                    <Button variant="outline" size="lg" className="px-8 py-6 text-lg">
                      <MessageSquare className="w-5 h-5 mr-2" />
                      Contacter le support
                    </Button>
                  </Link>
                </div>
              </Card>
            </TabsContent>

            {/* Code Tab - Enhanced */}
            <TabsContent value="code" className="space-y-8">
              <Card className="p-8 md:p-10">
                <h3 className="text-3xl font-bold text-gray-900 mb-8">Exemples de Code Complets</h3>
                <Tabs defaultValue="shortcode" className="w-full">
                  <TabsList className="grid w-full grid-cols-2 md:grid-cols-6 mb-6">
                    <TabsTrigger value="shortcode">Shortcode</TabsTrigger>
                    <TabsTrigger value="gutenberg">Gutenberg</TabsTrigger>
                    <TabsTrigger value="hooks">Hooks</TabsTrigger>
                    <TabsTrigger value="api">API REST</TabsTrigger>
                    <TabsTrigger value="ajax">AJAX</TabsTrigger>
                    <TabsTrigger value="webhook">Webhooks</TabsTrigger>
                  </TabsList>
                  {Object.entries(codeExamples).map(([key, code]) => (
                    <TabsContent key={key} value={key} className="space-y-4">
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="text-xl font-semibold text-gray-900 capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</h4>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleCopyCode(code, key)}
                          >
                            {copiedCode === key ? (
                              <>
                                <CheckCircle2 className="w-4 h-4 mr-2 text-green-600" />
                                Copié !
                              </>
                            ) : (
                              <>
                                <Copy className="w-4 h-4 mr-2" />
                                Copier le code
                              </>
                            )}
                          </Button>
                        </div>
                        <div className="bg-gray-900 rounded-lg p-6 overflow-x-auto">
                          <pre className="text-sm text-gray-100 leading-relaxed">
                            <code>{code}</code>
                          </pre>
                        </div>
                      </div>
                    </TabsContent>
                  ))}
                </Tabs>
              </Card>

              <Card className="p-8 md:p-10 bg-blue-50 border-2 border-blue-200">
                <h3 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-3">
                  <FileText className="w-7 h-7 text-blue-600" />
                  Documentation Complète
                </h3>
                <p className="text-lg text-gray-700 mb-6 leading-relaxed">
                  Pour des exemples plus avancés, des hooks personnalisés, et des cas d'usage spécifiques, consultez notre documentation complète avec plus de 50 exemples de code.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                  <Link href="/help/documentation/integrations/woocommerce">
                    <Button variant="outline" className="w-full justify-start">
                      <BookOpen className="w-4 h-4 mr-2" />
                      Documentation WooCommerce
                    </Button>
                  </Link>
                  <Link href="/help/documentation/api-reference">
                    <Button variant="outline" className="w-full justify-start">
                      <Code className="w-4 h-4 mr-2" />
                      Référence API
                    </Button>
                  </Link>
                  <Link href="/demo/playground">
                    <Button variant="outline" className="w-full justify-start">
                      <Play className="w-4 h-4 mr-2" />
                      API Playground
                    </Button>
                  </Link>
                  <Link href="/help/documentation/examples">
                    <Button variant="outline" className="w-full justify-start">
                      <FileCode className="w-4 h-4 mr-2" />
                      Plus d'exemples
                    </Button>
                  </Link>
                </div>
              </Card>
            </TabsContent>

            {/* Troubleshooting Tab - Enhanced */}
            <TabsContent value="troubleshooting" className="space-y-8">
              <Card className="p-8 md:p-10">
                <h3 className="text-3xl font-bold text-gray-900 mb-8">Dépannage Complet</h3>
                <Accordion type="single" collapsible className="w-full">
                  {troubleshootingItems.map((item, index) => (
                    <AccordionItem key={index} value={`item-${index}`} className="border-b border-gray-200">
                      <AccordionTrigger className="text-left font-semibold text-gray-900 text-lg py-4 hover:no-underline">
                        <div className="flex items-center gap-3">
                          <AlertCircle className="w-5 h-5 text-orange-500 flex-shrink-0" />
                          {item.question}
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="text-gray-600 whitespace-pre-line leading-relaxed pt-2 pb-4">
                        {item.answer}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </Card>

              <Card className="p-8 md:p-10 bg-yellow-50 border-2 border-yellow-200">
                <h3 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-3">
                  <MessageSquare className="w-7 h-7 text-yellow-600" />
                  Besoin d'aide supplémentaire ?
                </h3>
                <p className="text-lg text-gray-700 mb-6 leading-relaxed">
                  Notre équipe support est disponible 7j/7 pour vous aider. Contactez-nous et nous répondrons sous 2h. Nous offrons également des sessions de dépannage en direct via écran partagé.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <Link href="/contact">
                    <Button className="bg-yellow-600 hover:bg-yellow-700 text-white w-full">
                      <MessageSquare className="w-4 h-4 mr-2" />
                      Contacter le support
                    </Button>
                  </Link>
                  <Link href="/help/support">
                    <Button variant="outline" className="w-full">
                      <HelpCircle className="w-4 h-4 mr-2" />
                      Centre d'aide
                    </Button>
                  </Link>
                  <Link href="/help/documentation/troubleshooting">
                    <Button variant="outline" className="w-full">
                      <BookOpen className="w-4 h-4 mr-2" />
                      Guide dépannage
                    </Button>
                  </Link>
                </div>
              </Card>
            </TabsContent>

            {/* FAQ Tab - Enhanced */}
            <TabsContent value="faq" className="space-y-8">
              <Card className="p-8 md:p-10">
                <h3 className="text-3xl font-bold text-gray-900 mb-8">Questions Fréquentes</h3>
                <Accordion type="single" collapsible className="w-full">
                  {faqItems.map((item, index) => (
                    <AccordionItem key={index} value={`faq-${index}`} className="border-b border-gray-200">
                      <AccordionTrigger className="text-left font-semibold text-gray-900 text-lg py-4 hover:no-underline">
                        <div className="flex items-center gap-3">
                          <HelpCircle className="w-5 h-5 text-blue-500 flex-shrink-0" />
                          {item.question}
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="text-gray-600 leading-relaxed pt-2 pb-4">
                        {item.answer}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </Card>
            </TabsContent>

            {/* Pricing Tab - New */}
            <TabsContent value="pricing" className="space-y-8">
              <div className="text-center mb-12">
                <h3 className="text-4xl font-bold text-gray-900 mb-4">Tarifs Transparents</h3>
                <p className="text-xl text-gray-600">Choisissez le plan qui correspond à vos besoins</p>
              </div>
              <div className="grid md:grid-cols-3 gap-8">
                {pricingPlans.map((plan) => (
                  <Card
                    key={plan.id}
                    className={`p-8 ${plan.popular ? 'border-2 border-blue-500 shadow-xl scale-105' : ''}`}
                  >
                    {plan.popular && (
                      <div className="bg-blue-600 text-white text-center py-2 px-4 rounded-t-lg -mt-8 -mx-8 mb-4">
                        <span className="font-bold">Le plus populaire</span>
                      </div>
                    )}
                    <h4 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h4>
                    <div className="mb-4">
                      <span className="text-4xl font-bold text-gray-900">{plan.price}</span>
                      <span className="text-gray-600">{plan.period}</span>
                    </div>
                    <p className="text-gray-600 mb-6">{plan.description}</p>
                    <ul className="space-y-3 mb-8">
                      {plan.features.map((feature, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                          <span className="text-gray-700">{feature}</span>
                        </li>
                      ))}
                    </ul>
                    <Button
                      className={`w-full ${plan.popular ? 'bg-blue-600 hover:bg-blue-700' : ''}`}
                      variant={plan.popular ? 'default' : 'outline'}
                      size="lg"
                    >
                      {plan.id === 'enterprise' ? 'Nous contacter' : 'Commencer'}
                    </Button>
                  </Card>
                ))}
              </div>
            </TabsContent>

            {/* Comparison Tab - New */}
            <TabsContent value="comparison" className="space-y-8">
              <Card className="p-8 md:p-10">
                <h3 className="text-3xl font-bold text-gray-900 mb-8">Comparaison avec la Concurrence</h3>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b-2 border-gray-200">
                        <th className="text-left py-4 px-4 font-bold text-gray-900">Fonctionnalité</th>
                        <th className="text-center py-4 px-4 font-bold text-blue-600">Luneo</th>
                        <th className="text-center py-4 px-4 font-bold text-gray-600">Concurrents</th>
                      </tr>
                    </thead>
                    <tbody>
                      {comparisonFeatures.map((item, idx) => (
                        <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="py-4 px-4 font-semibold text-gray-900">{item.feature}</td>
                          <td className="py-4 px-4 text-center">
                            <div className="flex items-center justify-center gap-2 text-green-600">
                              <CheckCircle2 className="w-5 h-5" />
                              <span>{item.luneo}</span>
                            </div>
                          </td>
                          <td className="py-4 px-4 text-center text-gray-600">{item.competitors}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </section>

      {/* CTA Section - Enhanced */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white">
        <div className="max-w-5xl mx-auto text-center">
          <h2 className="text-4xl sm:text-5xl font-bold mb-6">
            Prêt à transformer votre boutique WooCommerce ?
          </h2>
          <p className="text-xl md:text-2xl text-blue-100 mb-10 leading-relaxed">
            Téléchargez le plugin gratuitement et commencez à personnaliser vos produits en moins de 10 minutes.
            <br />
            Aucune carte bancaire requise pour commencer.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="https://wordpress.org/plugins/luneo-customizer" target="_blank" rel="noopener noreferrer">
              <Button size="lg" className="bg-white text-blue-600 hover:bg-blue-50 font-bold px-10 py-7 text-lg shadow-xl">
                <Download className="w-5 h-5 mr-2" />
                Télécharger maintenant
                <ExternalLink className="w-4 h-4 ml-2" />
              </Button>
            </Link>
            <Link href="/contact">
              <Button size="lg" variant="outline" className="bg-white/10 border-2 border-white/30 text-white hover:bg-white/20 font-semibold px-10 py-7 text-lg">
                <MessageSquare className="w-5 h-5 mr-2" />
                Demander une démo
              </Button>
            </Link>
            <Link href="/register">
              <Button size="lg" variant="outline" className="bg-white/10 border-2 border-white/30 text-white hover:bg-white/20 font-semibold px-10 py-7 text-lg">
                <Rocket className="w-5 h-5 mr-2" />
                Créer un compte
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
