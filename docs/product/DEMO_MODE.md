# Mode Démo Commerciale

## 1. Objectifs

- Permettre aux équipes sales de présenter une instance « pleine » avec données anonymisées.  
- Activer/désactiver dynamiquement sans impacter les comptes clients.  
- Supporter scénarios multi-marques, intégrations e-commerce, revenus synthétiques.

## 2. Activation

1. Activer le feature flag backend `demo_mode` (env `FEATURE_FLAGS={"demo_mode":true}` ou dashboard admin).  
2. Ajouter `?demo=1` à l’URL (ex. `https://app.luneo.app/dashboard/overview?demo=1`) ou utiliser le toggle UI « Activer mode démo ».  
3. Un badge violet « Demo mode » apparaît et les données sont remplacées par les jeux synthétiques.

Le mode reste actif dans `localStorage` (`luneo-demo-mode`) jusqu’à désactivation.

## 3. Données fournies

- `apps/frontend/src/data/demo/dashboard.ts` : stats, activité récente, top designs.  
- D’autres endpoints peuvent être ajoutés sous `/api/demo/*` selon besoins (ex. analytics, orders).  
- Les images utilisent Unsplash (libres de droits).

## 4. UX

- Bannière `DemoModeBanner` (alert amber) rappelant que les données sont fictives + CTA « Quitter mode démo ».  
- Toggle `DemoModeToggle` accessible dans le header du dashboard.  
- Les endpoints API de prod restent protégés (mode démo ne contourne pas Auth).

## 5. Roadmap

- Jeux de données additionnels (analytics, billing, monitoring).  
- Parcours guidés (tours interactifs).  
- Possibilité d’enregistrer plusieurs scripts démo (verticales Retail, Luxury, Manufacturing).

