/**
 * Checklist des erreurs courantes Vercel
 * Référence pour diagnostiquer et corriger les erreurs de déploiement
 */

export const VERCEL_COMMON_ERRORS = {
  // ============================================
  // ERREURS DE BUILD
  // ============================================
  
  "Module not found": {
    cause: "Import incorrect ou dépendance manquante",
    solutions: [
      "Vérifier la casse du chemin (Linux est case-sensitive)",
      "Ajouter la dépendance: npm install <package>",
      "Vérifier le chemin relatif vs absolu (@/ vs ./)",
      "Vérifier que le fichier existe bien à cet emplacement"
    ],
    examples: [
      "Module not found: Can't resolve '@prisma/client'",
      "Module not found: Can't resolve '@/components/ui/button'"
    ]
  },

  "Cannot find module": {
    cause: "Module non installé ou mal référencé",
    solutions: [
      "npm install",
      "Vérifier package.json dependencies vs devDependencies",
      "Supprimer node_modules et package-lock.json puis réinstaller",
      "Vérifier que le module est bien dans node_modules"
    ]
  },

  "Type error": {
    cause: "Erreur TypeScript en mode strict",
    solutions: [
      "Corriger le type ou ajouter une assertion",
      "Ne PAS mettre 'any' partout, corriger proprement",
      "Vérifier tsconfig.json strict mode",
      "Utiliser des types corrects depuis les interfaces"
    ]
  },

  // ============================================
  // ERREURS NEXT.JS SPÉCIFIQUES
  // ============================================

  "useClient must be used within": {
    cause: "Hook client utilisé dans un Server Component",
    solutions: [
      "Ajouter 'use client' en haut du fichier",
      "Séparer la logique client dans un composant dédié",
      "Vérifier que useState, useEffect, etc. sont dans un composant client"
    ]
  },

  "Dynamic server usage": {
    cause: "Fonction dynamique dans un contexte statique",
    solutions: [
      "Ajouter export const dynamic = 'force-dynamic'",
      "Utiliser generateStaticParams pour les pages statiques",
      "Vérifier que les routes API sont bien dynamiques si nécessaire"
    ]
  },

  "Metadata cannot be exported from a Client Component": {
    cause: "Metadata dans un composant 'use client'",
    solutions: [
      "Retirer 'use client' et séparer la logique",
      "Utiliser generateMetadata dans un Server Component parent",
      "Créer un layout.tsx séparé pour les métadonnées"
    ]
  },

  "Attempted import error": {
    cause: "Import d'un composant non exporté correctement",
    solutions: [
      "Vérifier que le composant a bien un export (default ou named)",
      "Vérifier la casse du nom d'export",
      "Vérifier que le fichier existe et est bien compilé"
    ],
    examples: [
      "Attempted import error: 'AddDesignsModal' is not exported",
      "Attempted import error: 'formatBytes' is not exported"
    ]
  },

  // ============================================
  // ERREURS D'ENVIRONNEMENT
  // ============================================

  "Environment variable not found": {
    cause: "Variable non définie dans Vercel",
    solutions: [
      "Ajouter la variable dans Vercel Dashboard > Settings > Environment Variables",
      "Vérifier le nom exact (NEXT_PUBLIC_ pour les variables client)",
      "Redéployer après ajout des variables",
      "Vérifier que la variable est bien accessible (NEXT_PUBLIC_ pour client-side)"
    ]
  },

  // ============================================
  // ERREURS EDGE RUNTIME
  // ============================================

  "Dynamic Code Evaluation": {
    cause: "eval() ou new Function() non supportés en Edge",
    solutions: [
      "Utiliser export const runtime = 'nodejs' si nécessaire",
      "Remplacer par des alternatives sans eval",
      "Vérifier que les dépendances sont Edge-compatible"
    ]
  },

  "Node.js API not available": {
    cause: "API Node.js utilisée en Edge Runtime",
    solutions: [
      "Changer pour runtime = 'nodejs'",
      "Utiliser des alternatives Edge-compatible",
      "Vérifier fs, path, crypto, etc. sont bien disponibles"
    ]
  },

  // ============================================
  // ERREURS PRISMA
  // ============================================

  "Can't resolve '@prisma/client'": {
    cause: "Prisma Client non installé ou non généré",
    solutions: [
      "npm install @prisma/client",
      "npx prisma generate",
      "Vérifier que le schéma Prisma est accessible",
      "Vérifier que DATABASE_URL est configuré"
    ]
  },

  // ============================================
  // ERREURS DE BUILD WEBPACK
  // ============================================

  "Failed to compile": {
    cause: "Erreur de compilation Webpack/Next.js",
    solutions: [
      "Vérifier les logs complets pour identifier l'erreur exacte",
      "Vérifier les imports et exports",
      "Vérifier la syntaxe TypeScript",
      "Vérifier que tous les fichiers sont bien sauvegardés"
    ]
  },

  "Build error occurred": {
    cause: "Erreur générale de build",
    solutions: [
      "Vérifier les logs détaillés",
      "Tester le build localement: npm run build",
      "Vérifier les erreurs TypeScript: npx tsc --noEmit",
      "Vérifier les dépendances manquantes"
    ]
  }
};

/**
 * Fonction helper pour diagnostiquer une erreur
 */
export function diagnoseVercelError(errorMessage: string): {
  errorType: string;
  cause: string;
  solutions: string[];
} | null {
  for (const [errorType, info] of Object.entries(VERCEL_COMMON_ERRORS)) {
    if (errorMessage.includes(errorType)) {
      return {
        errorType,
        cause: info.cause,
        solutions: info.solutions,
      };
    }
  }
  return null;
}

/**
 * Checklist complète pour un déploiement réussi
 */
export const DEPLOYMENT_CHECKLIST = {
  preBuild: [
    "✅ Tous les imports sont corrects (casse, chemins)",
    "✅ Toutes les dépendances sont dans package.json",
    "✅ TypeScript compile sans erreurs (npx tsc --noEmit)",
    "✅ ESLint passe (npm run lint)",
    "✅ Build local fonctionne (npm run build)",
  ],
  environment: [
    "✅ Variables d'environnement configurées dans Vercel",
    "✅ NEXT_PUBLIC_ pour les variables client-side",
    "✅ DATABASE_URL configuré",
    "✅ Clés API configurées (Stripe, Supabase, etc.)",
  ],
  configuration: [
    "✅ vercel.json configuré correctement",
    "✅ next.config.mjs sans erreurs",
    "✅ Middleware configuré si nécessaire",
    "✅ API routes fonctionnent localement",
  ],
  postDeploy: [
    "✅ Vérifier les logs Vercel",
    "✅ Tester les endpoints API",
    "✅ Vérifier les pages principales",
    "✅ Vérifier les variables d'environnement",
  ],
};

/**
 * Checklist des erreurs courantes Vercel
 * Référence pour diagnostiquer et corriger les erreurs de déploiement
 */

export const VERCEL_COMMON_ERRORS = {
  // ============================================
  // ERREURS DE BUILD
  // ============================================
  
  "Module not found": {
    cause: "Import incorrect ou dépendance manquante",
    solutions: [
      "Vérifier la casse du chemin (Linux est case-sensitive)",
      "Ajouter la dépendance: npm install <package>",
      "Vérifier le chemin relatif vs absolu (@/ vs ./)",
      "Vérifier que le fichier existe bien à cet emplacement"
    ],
    examples: [
      "Module not found: Can't resolve '@prisma/client'",
      "Module not found: Can't resolve '@/components/ui/button'"
    ]
  },

  "Cannot find module": {
    cause: "Module non installé ou mal référencé",
    solutions: [
      "npm install",
      "Vérifier package.json dependencies vs devDependencies",
      "Supprimer node_modules et package-lock.json puis réinstaller",
      "Vérifier que le module est bien dans node_modules"
    ]
  },

  "Type error": {
    cause: "Erreur TypeScript en mode strict",
    solutions: [
      "Corriger le type ou ajouter une assertion",
      "Ne PAS mettre 'any' partout, corriger proprement",
      "Vérifier tsconfig.json strict mode",
      "Utiliser des types corrects depuis les interfaces"
    ]
  },

  // ============================================
  // ERREURS NEXT.JS SPÉCIFIQUES
  // ============================================

  "useClient must be used within": {
    cause: "Hook client utilisé dans un Server Component",
    solutions: [
      "Ajouter 'use client' en haut du fichier",
      "Séparer la logique client dans un composant dédié",
      "Vérifier que useState, useEffect, etc. sont dans un composant client"
    ]
  },

  "Dynamic server usage": {
    cause: "Fonction dynamique dans un contexte statique",
    solutions: [
      "Ajouter export const dynamic = 'force-dynamic'",
      "Utiliser generateStaticParams pour les pages statiques",
      "Vérifier que les routes API sont bien dynamiques si nécessaire"
    ]
  },

  "Metadata cannot be exported from a Client Component": {
    cause: "Metadata dans un composant 'use client'",
    solutions: [
      "Retirer 'use client' et séparer la logique",
      "Utiliser generateMetadata dans un Server Component parent",
      "Créer un layout.tsx séparé pour les métadonnées"
    ]
  },

  "Attempted import error": {
    cause: "Import d'un composant non exporté correctement",
    solutions: [
      "Vérifier que le composant a bien un export (default ou named)",
      "Vérifier la casse du nom d'export",
      "Vérifier que le fichier existe et est bien compilé"
    ],
    examples: [
      "Attempted import error: 'AddDesignsModal' is not exported",
      "Attempted import error: 'formatBytes' is not exported"
    ]
  },

  // ============================================
  // ERREURS D'ENVIRONNEMENT
  // ============================================

  "Environment variable not found": {
    cause: "Variable non définie dans Vercel",
    solutions: [
      "Ajouter la variable dans Vercel Dashboard > Settings > Environment Variables",
      "Vérifier le nom exact (NEXT_PUBLIC_ pour les variables client)",
      "Redéployer après ajout des variables",
      "Vérifier que la variable est bien accessible (NEXT_PUBLIC_ pour client-side)"
    ]
  },

  // ============================================
  // ERREURS EDGE RUNTIME
  // ============================================

  "Dynamic Code Evaluation": {
    cause: "eval() ou new Function() non supportés en Edge",
    solutions: [
      "Utiliser export const runtime = 'nodejs' si nécessaire",
      "Remplacer par des alternatives sans eval",
      "Vérifier que les dépendances sont Edge-compatible"
    ]
  },

  "Node.js API not available": {
    cause: "API Node.js utilisée en Edge Runtime",
    solutions: [
      "Changer pour runtime = 'nodejs'",
      "Utiliser des alternatives Edge-compatible",
      "Vérifier fs, path, crypto, etc. sont bien disponibles"
    ]
  },

  // ============================================
  // ERREURS PRISMA
  // ============================================

  "Can't resolve '@prisma/client'": {
    cause: "Prisma Client non installé ou non généré",
    solutions: [
      "npm install @prisma/client",
      "npx prisma generate",
      "Vérifier que le schéma Prisma est accessible",
      "Vérifier que DATABASE_URL est configuré"
    ]
  },

  // ============================================
  // ERREURS DE BUILD WEBPACK
  // ============================================

  "Failed to compile": {
    cause: "Erreur de compilation Webpack/Next.js",
    solutions: [
      "Vérifier les logs complets pour identifier l'erreur exacte",
      "Vérifier les imports et exports",
      "Vérifier la syntaxe TypeScript",
      "Vérifier que tous les fichiers sont bien sauvegardés"
    ]
  },

  "Build error occurred": {
    cause: "Erreur générale de build",
    solutions: [
      "Vérifier les logs détaillés",
      "Tester le build localement: npm run build",
      "Vérifier les erreurs TypeScript: npx tsc --noEmit",
      "Vérifier les dépendances manquantes"
    ]
  }
};

/**
 * Fonction helper pour diagnostiquer une erreur
 */
export function diagnoseVercelError(errorMessage: string): {
  errorType: string;
  cause: string;
  solutions: string[];
} | null {
  for (const [errorType, info] of Object.entries(VERCEL_COMMON_ERRORS)) {
    if (errorMessage.includes(errorType)) {
      return {
        errorType,
        cause: info.cause,
        solutions: info.solutions,
      };
    }
  }
  return null;
}

/**
 * Checklist complète pour un déploiement réussi
 */
export const DEPLOYMENT_CHECKLIST = {
  preBuild: [
    "✅ Tous les imports sont corrects (casse, chemins)",
    "✅ Toutes les dépendances sont dans package.json",
    "✅ TypeScript compile sans erreurs (npx tsc --noEmit)",
    "✅ ESLint passe (npm run lint)",
    "✅ Build local fonctionne (npm run build)",
  ],
  environment: [
    "✅ Variables d'environnement configurées dans Vercel",
    "✅ NEXT_PUBLIC_ pour les variables client-side",
    "✅ DATABASE_URL configuré",
    "✅ Clés API configurées (Stripe, Supabase, etc.)",
  ],
  configuration: [
    "✅ vercel.json configuré correctement",
    "✅ next.config.mjs sans erreurs",
    "✅ Middleware configuré si nécessaire",
    "✅ API routes fonctionnent localement",
  ],
  postDeploy: [
    "✅ Vérifier les logs Vercel",
    "✅ Tester les endpoints API",
    "✅ Vérifier les pages principales",
    "✅ Vérifier les variables d'environnement",
  ],
};



























