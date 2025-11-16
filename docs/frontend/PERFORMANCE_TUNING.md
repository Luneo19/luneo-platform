# Optimisation Frontend (Sprint K)

## 1. Next.js
- `compress: true` + `poweredByHeader: false` pour réduire la taille des réponses.
- Headers sécurité/perf : HSTS, COOP/CORP, X-Content-Type-Options, Referrer-Policy.
- `experimental.optimizeCss` + `scrollRestoration` activés.

## 2. Lazy Loading
- Remplacement des imports directs des démos lourdes (`Configurator3DDemo`, `CustomizerDemo`, `TryOnDemo`, `AssetHubDemo`) par les versions dynamiques (`components/lazy`).
- Résultat : bundle initial divisé par ~3 sur les pages publiques (chargement différé des libs Three.js/Konva).

## 3. Page d’accueil
- Suppression du “blank screen” initial (`mounted` guard) grâce à des données déterministes (grid/particles/stats via `useMemo`).
- Réduction des allocations à chaque render (lists pré-mémorisées).
- Meilleure compat SSR + TTFB.

## 4. À poursuivre
- Extraire les icônes Lucide peu utilisées vers des `dynamic import`.
- Étendre la compression (`@next/markdown`) pour les pages docs.
- Intégrer un script Lighthouse CI (voir scripts `pnpm analyze:lighthouse` futur).

