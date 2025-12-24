# 🧠 LUNEO ENTERPRISE — INSTRUCTIONS COMPLÈTES POUR CURSOR

## 🎯 Objectif

Tu travailles sur **Luneo Enterprise**, un SaaS B2B complet, déjà en **production**.
Ton rôle :

* Analyser le **workspace existant** avant toute création.
* **Optimiser** et **compléter** les éléments manquants sans dupliquer.
* Respecter l'architecture, le design system, les conventions et la hiérarchie des modules.
* Maintenir une **structure claire, scalable et documentée**.

---

## 🏗️ ARCHITECTURE GLOBALE

**Frontend :** Next.js 15 (TypeScript, Tailwind, shadcn/ui, Zustand, Framer Motion)
**Backend :** NestJS (10 modules complets, Prisma ORM, Redis, BullMQ, JWT Auth, Stripe, OpenAI, Cloudinary, SendGrid, Swagger)
**Database :** PostgreSQL (multi-tenant, RLS security, Prisma schema)
**Infra :** Vercel (frontend) | Hetzner (backend) | Managed Postgres DB
**Services externes :** Stripe, OpenAI, Cloudinary, SendGrid, Sentry

---

## 🧭 STRUCTURE DES DOSSIERS (RÉSUMÉ)

```
/frontend
  /src/app/(auth)/login, register
  /src/app/(dashboard)/(modules)/
      dashboard, ai-studio, analytics, products, billing, team,
      integrations, settings
  /help, /pricing, /about, /contact, /subscribe
/backend
  /src/modules/
      auth, users, brands, products, designs, orders, ai,
      admin, webhooks, health, email
/prisma
  schema.prisma  # Modèles complets multi-tenant
/docs
  INSTRUCTIONS.md (ce fichier)
  ARCHITECTURE.md
  ROADMAP.md
  TODO_CURSOR.md
```

---

## ✅ ÉTAT ACTUEL (Production Ready)

### **🎨 Frontend (Next.js 15) - COMPLET**
- ✅ **15+ pages fonctionnelles** : Landing, Auth, Dashboard, AI Studio, Analytics, Products, Billing, Team, Integrations, Help, Pricing, About, Contact, Subscribe
- ✅ **Design System** : shadcn/ui + Tailwind + tokens CSS + Framer Motion
- ✅ **Navigation Enterprise** : Sidebar + Header avec notifications
- ✅ **Authentification** : Login/Register avec validation Zod + React Hook Form
- ✅ **State Management** : Zustand stores (auth, dashboard)
- ✅ **API Integration** : TanStack Query + axios client
- ✅ **Responsive Design** : Mobile-first + animations
- ✅ **Performance** : Lighthouse 90+ optimisé

### **⚡ Backend (NestJS) - COMPLET**
- ✅ **10 modules complets** : auth, users, brands, products, designs, orders, ai, admin, webhooks, health, email
- ✅ **Authentification** : JWT + OAuth (Google, GitHub) + refresh tokens
- ✅ **Multi-tenancy** : Brands avec RLS security
- ✅ **Base de données** : PostgreSQL + Prisma ORM + migrations
- ✅ **Cache** : Redis pour sessions et performance
- ✅ **Jobs** : BullMQ pour traitement asynchrone
- ✅ **Monitoring** : Sentry + health checks
- ✅ **API Documentation** : Swagger complet
- ✅ **Rate Limiting** : Protection contre spam

### **🗄️ Base de Données (PostgreSQL) - COMPLETE**
- ✅ **15+ modèles** : User, Brand, Product, Design, Order, Payment, etc.
- ✅ **Multi-tenancy** : RLS policies par brand
- ✅ **Indexes optimisés** : Performance requêtes
- ✅ **Migrations** : Versioning schéma complet

### **☁️ Services Externes - CONFIGURÉS**
- ✅ **Stripe** : Paiements + webhooks + abonnements
- ✅ **OpenAI** : DALL-E 3 pour génération IA
- ✅ **Cloudinary** : Stockage images + CDN
- ✅ **SendGrid** : Emails transactionnels
- ✅ **Sentry** : Monitoring erreurs

### **🚀 Déploiement - EN PRODUCTION**
- ✅ **Frontend** : Vercel (app.luneo.app)
- ✅ **Backend** : Hetzner VPS
- ✅ **Database** : PostgreSQL managed
- ✅ **SSL** : Certificats automatiques
- ✅ **CDN** : Distribution globale

---

## ⚙️ OBJECTIFS POUR CURSOR

### 🔍 1. Analyse

* Inspecte tout le workspace avant d'écrire le moindre fichier.
* Identifie les pages, composants, modules et schémas déjà présents.
* Liste les doublons éventuels à **supprimer** ou **fusionner**.
* Vérifie la cohérence entre backend, frontend et base de données.

### 🧠 2. Optimisation

* Améliore les performances (API calls, cache Redis, requêtes Prisma).
* Factorise le code redondant.
* Documente les modules manquants dans `/docs/`.
* Vérifie la conformité TypeScript, ESLint et conventions NestJS.

### 🧩 3. Création / Extension

Crée **uniquement si inexistant** :

#### Frontend :

* `mobile/` version responsive optimisée (si non finalisée)
* `marketplace/` (future phase 2)
* `api-public/` docs + page
* Internationalisation (i18n) avec next-intl
* `white-label/` module (gestion thèmes, branding)

#### Backend :

* `public-api/` module REST (API keys, quotas)
* `marketplace/` module (designs publics)
* `mobile-sync/` endpoints (app mobile)
* `whitelabel/` module (branding + assets personnalisés)
* `i18n/` module (traductions dynamiques)

#### Base de données :

* Ajouter tables manquantes si nécessaires (locale, marketplace, public_api_keys)
* Vérifier indexes et RLS

---

## 🧱 RÈGLES DE STRUCTURATION

* Respecte l'architecture : chaque module = dossier cohérent.
* Ne jamais recréer un module déjà existant.
* Suis la logique multi-tenant : `brandId` obligatoire dans les entités liées.
* Chaque feature = route, service, controller, DTO, Prisma model.
* Documente les nouveaux endpoints avec Swagger.
* Utilise le design system (shadcn/ui + tailwind + tokens CSS).
* Évite toute duplication de code entre frontend et backend.
* Commente chaque nouvelle méthode et migration.

---

## 🚀 ROADMAP TECHNIQUE (PHASES)

### **Phase 1 – Terminée ✅**

Production stable, SaaS opérationnel.

### **Phase 2 – En cours 🔄**

* Mobile App 📱
* API publique 🔑
* Marketplace 🎨
* Analytics avancé 📊
* Multi-langue 🌍
* White-label ⚙️

### **Phase 3 – Planifiée 📋**

* Microservices 🧩
* Kubernetes 🚢
* Real-time ⚡
* IA personnalisée 🤖
* Global CDN 🌐
* Features Enterprise 🏢

---

## ✅ TODO LIST POUR CURSOR

### 🔍 Audit & Préparation

1. Inspecter l'arborescence existante (`frontend`, `backend`, `prisma`)
2. Générer un rapport d'analyse rapide (`TODO_CURSOR.md`)
3. Identifier les redondances ou modules orphelins
4. Vérifier la cohérence du schéma Prisma

### 🧠 Optimisation

5. Optimiser les requêtes API + cache Redis
6. Vérifier les types TS (front + back)
7. Factoriser composants UI et services
8. Ajouter tests unitaires manquants

### 🧩 Création / Extension

9. Créer module Public API (+ swagger doc)
10. Créer module Marketplace (front + back)
11. Intégrer i18n (front + back)
12. Créer module White-label (front + back)
13. Créer mobile-sync endpoints
14. Vérifier plan d'abonnement Stripe multi-tenants

### 🧰 Documentation

15. Mettre à jour `/docs/ARCHITECTURE.md`
16. Mettre à jour `/docs/ROADMAP.md`
17. Mettre à jour `/docs/TODO_CURSOR.md` à chaque étape

---

## 🧭 DIRECTIVES POUR CURSOR

* **Toujours analyser** avant de coder.
* **Jamais écraser** ou dupliquer un fichier sans vérifier.
* **Optimiser** avant de créer.
* **Commenter** chaque commit et documenter les changements.
* **Préserver** la structure existante et le design system.
* **Créer progressivement**, en commençant par les éléments critiques (API publique, i18n, white-label).

---

## 📚 FICHIERS DE RÉFÉRENCE À UTILISER

* `/docs/ARCHITECTURE.md` → schéma complet (Luneo Enterprise)
* `/docs/ROADMAP.md` → jalons et phases
* `/docs/TODO_CURSOR.md` → suivi tâches et état d'avancement

---

## 🧩 LIVRABLE ATTENDU

* Workspace cohérent et optimisé.
* Aucune duplication de pages ou modules.
* Documentation à jour.
* Modules manquants créés selon les spécifications.
* Tests et linting validés.
* Déploiement staging fonctionnel sur Vercel + Hetzner.

---

**Fin des instructions – tu peux maintenant exécuter la tâche selon la TODO.**
👉 Tu peux copier intégralement ce bloc dans ton repo sous :
/docs/INSTRUCTIONS.md
et dire à Cursor :

"Lis /docs/INSTRUCTIONS.md et suis toutes les directives et TODOs pas à pas."

