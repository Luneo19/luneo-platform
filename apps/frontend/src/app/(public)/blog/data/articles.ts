export interface BlogArticle {
  id: number;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  author: string;
  date: string;
  category: string;
  tags: string[];
  readTime: string;
  imageUrl: string;
}

export const articles: BlogArticle[] = [
  {
    id: 1,
    slug: 'comment-les-agents-ia-transforment-le-service-client',
    title: 'Comment les agents IA transforment le service client en 2026',
    excerpt: 'Les agents IA conversationnels ne sont plus un gadget : ils réduisent les temps de réponse de 80 % et améliorent la satisfaction client. Chiffres et bonnes pratiques.',
    author: 'Équipe Luneo',
    date: '2026-01-15',
    category: 'Agents IA',
    tags: ['agents IA', 'service client', 'automatisation', 'satisfaction'],
    readTime: '5 min',
    imageUrl: '/blog/article-1.jpg',
    content: `
<p>Les <strong>agents IA conversationnels</strong> sont devenus un pilier du service client moderne. Les entreprises qui les déploient constatent en moyenne une <strong>réduction de 80 % du temps de première réponse</strong> et une hausse significative de la satisfaction client.</p>

<h2>Pourquoi les agents IA font la différence</h2>
<p>Contrairement à un chatbot classique à base de règles, un agent IA comprend le contexte, s'appuie sur une base de connaissances et formule des réponses naturelles. Le client obtient une réponse pertinente en quelques secondes, 24h/24, sans attendre un opérateur humain.</p>

<h2>Intégrer un agent sans déshumaniser le support</h2>
<p>L'enjeu est de combiner automatisation et escalade intelligente. L'agent traite les questions récurrentes (FAQ, suivi, informations produit) et transfère les cas complexes à un humain avec tout le contexte. Cette approche libère les équipes pour les interactions à forte valeur ajoutée.</p>

<h2>Chiffres à retenir</h2>
<p>Au-delà du temps de réponse, les agents IA améliorent le taux de résolution au premier contact, réduisent le volume de tickets et permettent un support multilingue sans coût supplémentaire. Pour maximiser le ROI, alimentez votre agent avec une base de connaissances complète et mesurez les métriques de satisfaction.</p>
`,
  },
  {
    id: 2,
    slug: 'bases-de-connaissances-carburant-de-vos-agents-ia',
    title: 'Bases de connaissances : le carburant de vos agents IA',
    excerpt: 'Un agent IA est aussi bon que sa base de connaissances. Comment structurer, alimenter et maintenir vos sources pour des réponses fiables et pertinentes.',
    author: 'Équipe Luneo',
    date: '2026-01-18',
    category: 'Knowledge',
    tags: ['base de connaissances', 'RAG', 'agents IA', 'qualité'],
    readTime: '4 min',
    imageUrl: '/blog/article-2.jpg',
    content: `
<p>La qualité d'un <strong>agent IA</strong> dépend directement de la qualité de ses sources. Une base de connaissances bien structurée permet à l'agent de fournir des réponses précises, sourcées et à jour.</p>

<h2>Structurer sa base de connaissances</h2>
<p>Regroupez vos contenus par thème : FAQ, documentation produit, procédures internes, conditions générales. Chaque source doit être clairement identifiée pour que l'agent puisse citer ses références et que vous puissiez tracer l'origine des réponses.</p>

<h2>Types de sources supportées</h2>
<p>Les plateformes modernes acceptent des fichiers (PDF, Word, texte), des URLs de sites web (crawl automatique) et du contenu saisi manuellement. L'indexation par embeddings (RAG) permet à l'agent de retrouver les passages les plus pertinents pour chaque question.</p>

<h2>Maintenance et mise à jour</h2>
<p>Une base de connaissances n'est pas statique. Planifiez des ré-indexations régulières, supprimez les contenus obsolètes et ajoutez les nouvelles informations. Un agent bien alimenté, c'est un agent qui reste fiable dans le temps.</p>
`,
  },
  {
    id: 3,
    slug: 'deployer-agent-ia-multicanal-widget-whatsapp-email',
    title: 'Déployer un agent IA multicanal : widget, WhatsApp, email',
    excerpt: 'Votre agent IA ne doit pas rester cantonné à un seul canal. Déployez-le sur votre site, WhatsApp et email pour une expérience client unifiée.',
    author: 'Équipe Luneo',
    date: '2026-01-22',
    category: 'Multicanal',
    tags: ['multicanal', 'widget', 'WhatsApp', 'email', 'agents IA'],
    readTime: '5 min',
    imageUrl: '/blog/article-3.jpg',
    content: `
<p>Un <strong>agent IA multicanal</strong> répond à vos clients là où ils sont : sur votre site via un widget, sur WhatsApp, par email ou via API. L'expérience est cohérente quel que soit le point de contact.</p>

<h2>Le widget web : premier point de contact</h2>
<p>Le widget de chat s'intègre sur votre site en quelques minutes. Personnalisez les couleurs, le message d'accueil et la position. Le visiteur obtient une réponse instantanée sans quitter la page, ce qui réduit le taux de rebond et augmente les conversions.</p>

<h2>WhatsApp et messageries</h2>
<p>WhatsApp est le canal préféré de millions d'utilisateurs. Connecter votre agent à WhatsApp Business permet de traiter les demandes clients directement dans leur messagerie habituelle, avec le même niveau de qualité que sur le widget web.</p>

<h2>Email et API</h2>
<p>Pour les demandes arrivant par email, l'agent peut analyser le contenu, proposer une réponse et la soumettre à validation humaine. L'API ouverte permet d'intégrer l'agent dans n'importe quel workflow existant (CRM, helpdesk, application métier).</p>
`,
  },
  {
    id: 4,
    slug: 'guide-integrer-agent-ia-shopify-woocommerce',
    title: 'Guide : intégrer un agent IA sur Shopify ou WooCommerce',
    excerpt: 'Connecter un agent IA à votre boutique en ligne en quelques étapes. Widget, FAQ automatisée et support intelligent pour vos clients e-commerce.',
    author: 'Équipe Luneo',
    date: '2026-01-25',
    category: 'Tutorial',
    tags: ['Shopify', 'WooCommerce', 'intégration', 'agents IA', 'e-commerce'],
    readTime: '6 min',
    imageUrl: '/blog/article-4.jpg',
    content: `
<p>Intégrer un <strong>agent IA</strong> sur votre boutique Shopify ou WooCommerce permet d'automatiser le support client, de répondre aux questions produit et de réduire les abandons de panier.</p>

<h2>Installation du widget</h2>
<p>L'intégration se fait via un snippet JavaScript à ajouter dans votre thème. Sur Shopify, utilisez le fichier theme.liquid ; sur WooCommerce, ajoutez-le dans le footer de votre thème WordPress. Le widget est opérationnel en quelques minutes.</p>

<h2>Alimenter l'agent avec vos données produit</h2>
<p>Connectez votre catalogue produit comme source de connaissances. L'agent pourra répondre aux questions sur la disponibilité, les caractéristiques, les tailles et les délais de livraison. Ajoutez votre FAQ et vos conditions générales pour couvrir les questions récurrentes.</p>

<h2>Mesurer l'impact</h2>
<p>Suivez les métriques clés : nombre de conversations, taux de résolution automatique, temps de réponse moyen et score de satisfaction. Un bon agent IA résout 60 à 80 % des demandes sans intervention humaine, libérant vos équipes pour les cas complexes.</p>
`,
  },
  {
    id: 5,
    slug: 'reduire-volume-tickets-support-grace-agents-ia',
    title: 'Réduire le volume de tickets support de 60 % grâce aux agents IA',
    excerpt: 'Les équipes support sont débordées. Les agents IA absorbent les questions répétitives et permettent aux humains de se concentrer sur les cas à forte valeur.',
    author: 'Équipe Luneo',
    date: '2026-01-28',
    category: 'Insight',
    tags: ['support', 'tickets', 'automatisation', 'agents IA', 'productivité'],
    readTime: '4 min',
    imageUrl: '/blog/article-5.jpg',
    content: `
<p>Le <strong>volume de tickets support</strong> est un défi constant pour les équipes. Les agents IA permettent de traiter automatiquement les questions récurrentes et de réduire significativement la charge de travail.</p>

<h2>Ce que l'agent IA prend en charge</h2>
<p>Questions sur les horaires, politique de retour, suivi de commande, informations produit, réinitialisation de mot de passe... Ces demandes représentent souvent 60 à 80 % du volume total. Un agent IA bien configuré les résout instantanément.</p>

<h2>Escalade intelligente</h2>
<p>Quand l'agent ne peut pas répondre ou détecte une frustration, il transfère la conversation à un humain avec tout le contexte. L'opérateur dispose de l'historique complet et peut résoudre le problème plus rapidement.</p>

<h2>Résultats observés</h2>
<p>Les entreprises qui déploient des agents IA constatent une <strong>réduction de 40 à 70 % du volume de tickets</strong>, une amélioration du temps de résolution et une meilleure satisfaction des équipes support, qui se concentrent sur les interactions complexes et gratifiantes.</p>
`,
  },
  {
    id: 6,
    slug: 'tendances-ia-conversationnelle-2026',
    title: 'Les tendances de l\'IA conversationnelle en 2026',
    excerpt: 'Agents autonomes, RAG, personnalisation contextuelle : les tendances qui façonnent l\'IA conversationnelle cette année et comment en tirer parti.',
    author: 'Équipe Luneo',
    date: '2026-02-01',
    category: 'Tendances',
    tags: ['IA conversationnelle', '2026', 'RAG', 'tendances', 'agents IA'],
    readTime: '5 min',
    imageUrl: '/blog/article-6.jpg',
    content: `
<p>L'année 2026 marque un tournant pour l'<strong>IA conversationnelle</strong> : les agents deviennent plus autonomes, plus contextuels et plus intégrés dans les workflows métier.</p>

<h2>RAG et bases de connaissances dynamiques</h2>
<p>Le Retrieval-Augmented Generation (RAG) s'impose comme la norme. Les agents ne se contentent plus de générer du texte : ils recherchent dans vos données, citent leurs sources et restent factuels. La qualité des bases de connaissances devient un avantage concurrentiel.</p>

<h2>Personnalisation contextuelle</h2>
<p>Les agents exploitent le contexte de la conversation (historique, profil client, page visitée) pour adapter leurs réponses. Un visiteur sur la page pricing reçoit une réponse différente d'un client existant qui a un problème technique.</p>

<h2>Intégration dans les workflows métier</h2>
<p>L'agent IA ne se limite plus au chat. Il déclenche des actions (création de ticket, mise à jour CRM, envoi d'email), s'intègre via webhooks et API, et devient un maillon actif de la chaîne opérationnelle.</p>
`,
  },
  {
    id: 7,
    slug: 'mesurer-roi-agent-ia-metriques-essentielles',
    title: 'Mesurer le ROI d\'un agent IA : les métriques essentielles',
    excerpt: 'Déployer un agent IA, c\'est bien. Mesurer son impact, c\'est mieux. Les KPIs à suivre pour justifier et optimiser votre investissement.',
    author: 'Équipe Luneo',
    date: '2026-02-05',
    category: 'ROI',
    tags: ['ROI', 'métriques', 'analytics', 'agents IA', 'performance'],
    readTime: '5 min',
    imageUrl: '/blog/article-7.jpg',
    content: `
<p>Un <strong>agent IA</strong> représente un investissement. Pour le justifier et l'optimiser, il faut suivre les bonnes métriques et démontrer un <strong>retour sur investissement concret</strong>.</p>

<h2>Métriques de performance</h2>
<p>Taux de résolution automatique (combien de conversations résolues sans humain), temps de réponse moyen, nombre de conversations traitées par jour. Ces indicateurs mesurent l'efficacité opérationnelle de l'agent.</p>

<h2>Métriques de qualité</h2>
<p>Score de satisfaction (CSAT), taux d'escalade, pertinence des réponses (via feedback utilisateur). Un agent rapide mais imprécis dégrade l'expérience. L'objectif est un équilibre entre vitesse et qualité.</p>

<h2>Impact business</h2>
<p>Réduction du coût par interaction, diminution du turnover des équipes support, augmentation du NPS. En moyenne, les entreprises qui déploient un agent IA réduisent leur coût de support de 30 à 50 % tout en améliorant la satisfaction client.</p>
`,
  },
  {
    id: 8,
    slug: 'comment-choisir-plateforme-agents-ia-guide-comparatif',
    title: 'Comment choisir sa plateforme d\'agents IA : guide comparatif',
    excerpt: 'Choisir une plateforme d\'agents IA implique d\'évaluer la qualité du LLM, les intégrations, la gestion des connaissances et le coût. Critères et questions clés.',
    author: 'Équipe Luneo',
    date: '2026-02-10',
    category: 'Guide',
    tags: ['plateforme', 'comparatif', 'choix', 'agents IA', 'SaaS'],
    readTime: '6 min',
    imageUrl: '/blog/article-8.jpg',
    content: `
<p>Choisir une <strong>plateforme d'agents IA</strong> est une décision stratégique. L'outil doit s'intégrer à votre stack, offrir une qualité de réponse professionnelle et évoluer avec votre volume.</p>

<h2>Critères essentiels</h2>
<p>Qualité du modèle de langage, gestion des bases de connaissances (RAG), personnalisation du ton et du comportement, support multilingue, analytics intégrés. Vérifiez que les fonctionnalités prioritaires sont natives et stables.</p>

<h2>Intégrations et déploiement</h2>
<p>Widget web, WhatsApp, email, API, webhooks : vérifiez les canaux supportés. L'intégration avec vos outils existants (CRM, helpdesk, e-commerce) est essentielle pour un workflow fluide. La qualité de la documentation et du support technique conditionne la vitesse de déploiement.</p>

<h2>Coûts et scalabilité</h2>
<p>Comparez les modèles de prix : par conversation, par message, par agent ou par abonnement. Anticipez la montée en charge et les coûts d'utilisation de l'IA (tokens). Une plateforme comme Luneo offre un modèle transparent avec des crédits IA inclus dans chaque plan.</p>
`,
  },
];

export function getArticleBySlug(slug: string): BlogArticle | undefined {
  return articles.find((a) => a.slug === slug);
}

export function getArticleById(id: number): BlogArticle | undefined {
  return articles.find((a) => a.id === id);
}

export function getAllArticles(): BlogArticle[] {
  return [...articles].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );
}
