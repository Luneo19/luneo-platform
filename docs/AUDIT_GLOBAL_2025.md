# 🧭 Audit Global Fonctionnel & UX – Luneo Platform (14 nov 2025)

Ce document suit en continu l’état réel de chaque page / module (public + dashboard + APIs).  
Il est mis à jour au fur et à mesure des correctifs pour servir de référence unique avant relance des déploiements.

---

## 1. Méthodologie

| Étape | Description |
| --- | --- |
| **Cartographie** | Liste exhaustive des routes (Next App Router, API routes, backend endpoints). |
| **Vérification** | Pour chaque page : charge utile réelle, CTA/flux, états (loading/error), accessibilité, responsive, SEO. |
| **Classification** | ✅ Fonctionnel · ⚠️ Partiel/Marketing · ❌ Bloquant. |
| **Actions** | Correctifs immédiats (code/UI), backlog court terme, dépendances backend/Supabase. |
| **Tests** | Lint/build, scénarios manuels, à compléter par Playwright + check links automatisé. |

---

## 2. Synthèse rapide (mise à jour en continu)

| Zone | Statut | Constats principaux | Actions en cours |
| --- | --- | --- | --- |
| Register/Login | ⚠️ | Signup dépend totalement des variables Supabase + aucun onboarding profil. | Vérifier env Vercel + ajouter création profil SaaS + tests login/email confirmé. |
| Solutions – Customizer | ⚠️ → ✅ (en cours) | Page purement marketing. Ajouté une vraie démo interactive (Konva) déclenchée via modal. | Finaliser tracking + CTA (demo -> register) + connecter analytics. |
| Solutions – Virtual Try-On / AI Studio | ⚠️ | UI démonstrative (caméra inerte, boutons inactifs). | Brancher modules WebRTC/WebGL existants ou proposer fallback (demo vidéo + CTA contact). |
| Dashboard Customizer | ⚠️ | Repose sur Supabase Products (auth obligatoire) → erreur quand données absentes. | Créer seed/pseudo-data pour démo + check API products. |
| Dashboard Try-On / AR Studio | ⚠️ | Mock UI, pas d’intégration back. | Spécifier API attendue + plan de dev. |
| API Routes publiques | ✅ (lint) | Les endpoints existent mais nécessitent variables Supabase + backend prêt. | Tester via `test-profile-api.sh` + Postman. |
| Backend Nest | ⚠️ | Build ok local mais dépend Node 22 (Vercel -> 22.x vs local 20.x). | Harmoniser engines, relancer `vercel --prod backend`. |

> **Légende** : ✅ opérationnel / ⚠️ partiel ou dépendance / ❌ bloquant ou inexistant

---

## 3. Détails par zone (extraits)

### 3.1 Authentification
- `apps/frontend/src/app/(auth)/register/page.tsx` : validation password OK, mais `createClient()` dépend de `NEXT_PUBLIC_SUPABASE_URL/ANON_KEY`.  
- Aucun appel pour créer un profil dans `profiles`.  
- **Plan** : créer un endpoint `/api/auth/register` côté backend ou Supabase Function pour encapsuler l’onboarding (profil, brand par défaut, quota).  
- Ajouter tests Playwright : register → email mocked → login.

### 3.2 Pages Solutions
- Customizer : **fixé** via `DemoCustomizer` (Konva réel, mode demo).  
- Virtual Try-On : boutons (Photo/Vidéo/Partager) décoratifs, caméra non branchée.  
- AI Design Hub, Marketing, Social : CTA “Réserver une démo” ➜ `/contact` mais formulaire minimal.  
- **Plan** : pour chaque solution, fournir soit une Feature Flag vers un module réel, soit une démo fonctionnelle (ex: sample dataset, video), sinon masquer les CTA deep.

### 3.3 Dashboard Modules
- `/(dashboard)/customize/[productId]` : nécessite produit Supabase + auth. Sans dataset, 404.  
- `/(dashboard)/virtual-try-on` / `ar-studio` : UI statique.  
- Billing/Team/API Keys : à tester avec environnement Supabase réel.  
- **Plan** : préparer seeds (SQL) + dataset fictif pour mode “demo” + tests automatisés.

### 3.4 Backend (Nest + Prisma)
- `package.json` exige Node 22 → conflit local (20.11).  
- Deploy Vercel backend interrompu (npm workspace).  
- **Plan** :  
  1. Stabiliser `engines` (Node 20 partout + `@vercel/node@5` avec `pnpm install` root) ou migrer dev vers Node 22.  
  2. Relancer `vercel --prod backend`.  
  3. Vérifier `RedisOptimizedService`, `SmartCacheService` activés en prod (variables, Redis URL).  

### 3.5 Monitoring / Tests
- Lint + build frontend ✅ (commandes exécutées avec `NPM_CONFIG_ENGINE_STRICT=false`).  
- Pas encore de Playwright/Link-check.  
- **Plan** : introduire `pnpm test:e2e` (Playwright) + script crawler (ex: `npx broken-link-checker https://app.luneo.app`).  

---

## 4. Backlog d’actions (court terme)
1. [ ] Vérifier/mettre à jour variables Supabase sur Vercel (frontend + backend).  
2. [ ] Implémenter onboarding profil post-signup (Supabase function ou backend API).  
3. [ ] Rendre “Virtual Try-On” & “AI Studio” interactifs (ou fallback crédible + CTA contact).  
4. [ ] Seed données demo pour dashboard (products/templates/orders).  
5. [ ] Harmoniser Node engines + relancer déploiement backend.  
6. [ ] Mettre en place tests Playwright basiques (register/login, customizer en mode demo, contact form).  
7. [ ] Script d’audit des liens publics.  

---

👉 Ce document évoluera après chaque lot de corrections (statut, issues résolues, nouveaux blocs).  
Dernière mise à jour : **14/11/2025 – 16h00**.


