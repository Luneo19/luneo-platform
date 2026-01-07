# 🎯 CURSOR RULES - LUNEO PLATFORM

**Règles impératives pour Cursor AI. À suivre ABSOLUMENT.**

---

## 🏗️ ARCHITECTURE

1. Tous les composants doivent faire < 300 lignes. Découper si nécessaire.
2. Aucune dépendance circulaire autorisée. Utiliser `packages/types` pour les types partagés.
3. Chaque composant/module a UNE seule responsabilité.
4. Utiliser la composition plutôt que l'héritage.

---

## 🚀 NEXT.JS APP ROUTER

5. Par défaut, TOUS les composants sont Server Components.
6. Utiliser `'use client'` UNIQUEMENT si nécessaire (hooks, event handlers, browser APIs).
7. Marquer `'use client'` au niveau LE PLUS BAS possible dans l'arbre des composants.
8. Les pages (route.tsx) sont TOUJOURS Server Components sauf cas exceptionnel documenté.
9. Fetcher les données dans Server Components ou Server Actions. Passer les données en props aux Client Components.
10. Les routes API doivent utiliser `ApiResponseBuilder` pour la structure de réponse.
11. Les Server Components qui fetchent des données doivent être `async` et utiliser `await`.

---

## 🌐 SERVER COMPONENTS

12. Aucune API browser (`window`, `document`, `localStorage`, etc.) dans Server Components.
13. Aucun hook React (`useState`, `useEffect`, etc.) dans Server Components.
14. Les Server Components peuvent être `async` pour le data fetching.

---

## 💻 CLIENT COMPONENTS

15. `'use client'` doit être au niveau LE PLUS BAS possible. Créer des composants wrapper Client Components minimes.
16. Les librairies > 100KB doivent être importées dynamiquement avec `dynamic()` et `ssr: false` si non SSR-safe.
17. Utiliser state local (`useState`) par défaut. Zustand pour state global partagé. React Query pour server state.
18. Toujours protéger l'utilisation des APIs browser avec `typeof window !== 'undefined'` ou dans `useEffect`.

---

## 📦 LIBRAIRIES EXTERNES

19. Toute librairie utilisant `window`, `document`, ou autres APIs browser doit être importée dynamiquement avec `ssr: false`.
20. Librairies non SSR-safe connues : `three`, `@react-three/fiber`, `@react-three/drei`, `konva`, `react-konva`, `framer-motion`, `@mediapipe/*`, `html2canvas`, `jspdf`, `socket.io-client`.
21. Toujours importer de manière spécifique : `import { specific } from 'library'` plutôt que `import *`.
22. Vérifier la compatibilité SSR avant d'ajouter une nouvelle librairie.

---

## 📝 TYPES

23. Aucun `any` autorisé. Utiliser `unknown` si le type est vraiment inconnu, puis faire un type guard.
24. Tous les composants doivent avoir des types explicites pour les props. Utiliser `interface` pour les props complexes.
25. Les types API doivent être générés depuis les schémas (Zod) ou validés à l'exécution.
26. Utiliser des types stricts. Éviter les types optionnels sauf si vraiment nécessaire.

---

## 🔧 BUILD & WEBPACK

27. La configuration Webpack doit être minimale. Utiliser les optimisations Next.js par défaut.
28. Le bundle initial doit être < 200KB gzipped. Utiliser dynamic imports pour le code non critique.
29. Le build doit prendre < 2 minutes. Analyser avec `ANALYZE=true next build` régulièrement.
30. Ne jamais utiliser `ignoreBuildErrors: true` ou `skipLibCheck: true` pour masquer des erreurs.

---

## 🚢 VERCEL & PRODUCTION

31. Toutes les variables d'environnement doivent être documentées et vérifiées avant déploiement.
32. `ignoreBuildErrors` et `skipLibCheck` doivent être `false` en production. Corriger les erreurs plutôt que les masquer.
33. Le build ne doit jamais timeout. Optimiser le code et la configuration si nécessaire.
34. Tester le build en local avant de pusher : `pnpm build`.

---

## 📋 PATTERNS OBLIGATOIRES

35. Server Component + Client Component minimal : Data fetching dans Server Component, interaction dans Client Component minimal.
36. Dynamic import avec loading state pour toutes les librairies lourdes.
37. Hook personnalisé pour toutes les APIs browser (localStorage, sessionStorage, etc.).
38. Server Actions pour toutes les mutations de données.
39. Error Boundaries pour toutes les pages critiques.

---

## ❌ ANTI-PATTERNS INTERDITS

40. Ne jamais mettre `'use client'` au niveau root layout sauf composants spécifiques (Providers).
41. Ne jamais importer de librairie lourde dans root layout.
42. Ne jamais utiliser `any` pour résoudre des erreurs TypeScript.
43. Ne jamais faire de props drilling > 3 niveaux. Utiliser Context ou Server Component.
44. Ne jamais fetcher des données dans Client Components avec `useEffect`. Utiliser Server Components ou Server Actions.
45. Ne jamais utiliser d'API browser sans protection `typeof window`.
46. Ne jamais créer de composant > 300 lignes sans le découper.
47. Ne jamais créer de dépendance circulaire.

---

## ✅ CHECKLIST AVANT GÉNÉRATION DE CODE

48. Vérifier si le composant doit être Server ou Client Component.
49. Si Client Component, vérifier si `'use client'` peut être placé plus bas.
50. Vérifier si des librairies lourdes sont utilisées → dynamic import.
51. Vérifier si des APIs browser sont utilisées → protection `typeof window`.
52. Vérifier si le composant dépasse 300 lignes → découper.
53. Vérifier si les types sont explicites → pas de `any`.
54. Vérifier si data fetching nécessaire → Server Component ou Server Action.
55. Vérifier si interaction utilisateur → Client Component minimal.

---

## 🎯 PHILOSOPHIE

56. Production d'abord : Le code doit fonctionner en production Vercel avant de fonctionner en local.
57. Build-first mindset : Si le build échoue, le code est incorrect, même s'il fonctionne en dev.
58. Zéro tolérance : Aucune erreur TypeScript, ESLint, ou Webpack n'est acceptable en production.
59. SSR par défaut : Tous les composants sont Server Components sauf si explicitement marqués `'use client'`.
60. Vérification continue : Chaque commit doit passer `pnpm build` sans erreur.

---

**Ces règles sont OBLIGATOIRES. Ne jamais les contourner. Consulter ENGINEERING_GUIDELINES.md pour plus de détails.**








