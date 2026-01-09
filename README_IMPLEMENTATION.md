# 📖 GUIDE COMPLET - IMPLÉMENTATION SOCLE 3D/AR + PERSONNALISATION

**Version**: 1.0.0  
**Date**: Décembre 2024  
**Status**: ✅ **COMPLÈTE ET DÉPLOYÉE**

---

## 🎯 VUE D'ENSEMBLE

Cette implémentation ajoute un socle complet pour la personnalisation 3D/AR avec IA et production, incluant :

- **DesignSpec** : Spécifications versionnées et déterministes
- **Snapshot** : Points-in-time immuables pour traçabilité
- **OrderItem** : Support multi-items pour les commandes
- **Personalization** : Moteur de règles et validation
- **Rendering** : Queue et statuts pour rendus
- **Manufacturing** : Export packs (SVG/DXF/PDF/ZIP)

---

## 📁 STRUCTURE DES FICHIERS

### Schema Prisma

```
apps/backend/prisma/
├── schema.prisma (modifié)
└── migrations/
    └── 20241201000000_add_design_spec_snapshot_order_items/
        └── migration.sql
```

### Modules Backend

```
apps/backend/src/modules/
├── specs/                    # DesignSpec management
│   ├── specs.module.ts
│   ├── specs.service.ts
│   ├── specs.controller.ts
│   ├── services/
│   │   ├── spec-builder.service.ts
│   │   ├── spec-canonicalizer.service.ts
│   │   └── spec-hasher.service.ts
│   └── dto/
│       └── create-spec.dto.ts
│
├── snapshots/               # Snapshot management
│   ├── snapshots.module.ts
│   ├── snapshots.service.ts
│   ├── snapshots.controller.ts
│   └── dto/
│       └── create-snapshot.dto.ts
│
├── personalization/          # Rules engine & validation
│   ├── personalization.module.ts
│   ├── personalization.service.ts
│   ├── personalization.controller.ts
│   ├── services/
│   │   ├── rules-engine.service.ts
│   │   ├── unicode-normalizer.service.ts
│   │   ├── text-validator.service.ts
│   │   └── auto-fit.service.ts
│   └── dto/
│       ├── validate-zone-input.dto.ts
│       ├── normalize-text.dto.ts
│       └── auto-fit.dto.ts
│
├── manufacturing/           # Export packs
│   ├── manufacturing.module.ts
│   ├── manufacturing.service.ts
│   ├── manufacturing.controller.ts
│   ├── services/
│   │   ├── export-pack.service.ts
│   │   ├── svg-generator.service.ts
│   │   ├── dxf-generator.service.ts
│   │   └── pdf-generator.service.ts
│   └── dto/
│       └── generate-export-pack.dto.ts
│
└── render/                  # Extension
    ├── services/
    │   ├── render-queue.service.ts
    │   └── render-status.service.ts
    └── dto/
        └── enqueue-render.dto.ts
```

### Workers

```
apps/backend/src/jobs/workers/
├── render/
│   ├── render-preview.processor.ts
│   └── render-final.processor.ts
└── manufacturing/
    └── export-pack.processor.ts
```

### Guards & Decorators

```
apps/backend/src/common/
├── decorators/
│   ├── brand-scoped.decorator.ts
│   └── idempotency-key.decorator.ts
├── guards/
│   ├── brand-scoped.guard.ts
│   └── idempotency.guard.ts
└── interceptors/
    └── idempotency.interceptor.ts
```

---

## 🚀 DÉMARRAGE RAPIDE

### 1. Installation

```bash
# Installer les dépendances
pnpm install

# Générer Prisma Client
cd apps/backend
npx prisma generate
```

### 2. Migrations

```bash
# Appliquer les migrations
npx prisma migrate deploy

# Vérifier l'état
npx prisma migrate status
```

### 3. Build

```bash
# Build backend
cd apps/backend
pnpm run build
```

### 4. Démarrage

```bash
# Démarrer le backend
pnpm run start

# Démarrer les workers (si séparé)
pnpm run start:workers
```

---

## 📚 DOCUMENTATION DÉTAILLÉE

### Architecture

- **IMPLEMENTATION_PLAN_3D_AR_PERSONALIZATION.md** : Plan complet
- **PRISMA_SCHEMA_DIFF.md** : Diff Prisma détaillé

### Déploiement

- **DEPLOYMENT_GUIDE.md** : Guide étape par étape
- **DEPLOYMENT_COMPLETE.md** : État du déploiement

### Exemples

- **IMPLEMENTATION_FILES_EXAMPLES.md** : Exemples de code

### Référence

- **IMPLEMENTATION_FINAL.md** : Résumé final
- **README_NEXT_STEPS.md** : Prochaines étapes

---

## 🔗 API REFERENCE

### Base URL

```
Production: https://api.luneo.com
Staging: https://api-staging.luneo.com
Local: http://localhost:3000
```

### Authentication

Tous les endpoints nécessitent :
```
Authorization: Bearer <JWT_TOKEN>
```

### Endpoints

Voir `DEPLOYMENT_COMPLETE.md` pour la liste complète des endpoints.

---

## 🛠️ DÉVELOPPEMENT

### Ajouter un nouveau endpoint

1. Créer le DTO dans `dto/`
2. Ajouter la méthode dans le service
3. Ajouter la route dans le controller
4. Ajouter `@BrandScoped()` pour le scoping
5. Tester

### Ajouter un nouveau worker

1. Créer le processor dans `jobs/workers/`
2. Ajouter la queue dans `jobs.module.ts`
3. Ajouter le processor dans les providers
4. Tester

---

## 🐛 DÉPANNAGE

### Migration échoue

```bash
# Vérifier l'état
npx prisma migrate status

# Résoudre les conflits
npx prisma migrate resolve --applied <migration_name>
```

### Build échoue

```bash
# Vérifier les dépendances
pnpm install

# Vérifier TypeScript
pnpm run type-check

# Vérifier les imports
pnpm run lint
```

### Workers ne démarrent pas

```bash
# Vérifier Redis
redis-cli ping

# Vérifier les logs
tail -f logs/workers.log
```

---

## 📊 MÉTRIQUES

### Performance

- Temps de réponse API : < 200ms (p95)
- Durée des renders : < 5s (preview), < 30s (final)
- Durée des exports : < 10s

### Disponibilité

- Uptime : > 99.9%
- Error rate : < 0.1%

---

## 🎓 RESSOURCES

- [Prisma Docs](https://www.prisma.io/docs)
- [NestJS Docs](https://docs.nestjs.com)
- [BullMQ Docs](https://docs.bullmq.io)
- [Redis Docs](https://redis.io/docs)

---

## 📞 SUPPORT

Pour toute question ou problème :

1. Vérifier la documentation
2. Vérifier les logs
3. Vérifier Sentry
4. Contacter l'équipe

---

**BONNE UTILISATION ! 🚀**











