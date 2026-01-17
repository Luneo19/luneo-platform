# 🏗️ ARCHITECTURE API CLIENT UNIFIÉ

## 🎯 OBJECTIF

Créer un système d'API client unifié avec React Query pour :
1. Centraliser toutes les requêtes API
2. Gérer automatiquement le cache
3. Simplifier l'utilisation dans les composants
4. Améliorer les performances (cache intelligent)
5. Gérer automatiquement les erreurs et retry

## 📐 STRUCTURE PROPOSÉE

```
apps/frontend/src/lib/
├── api/
│   ├── unified-client.ts        # Client API unifié (axios)
│   ├── query-client.ts          # Configuration React Query
│   └── endpoints/
│       ├── auth.endpoints.ts    # Endpoints auth typés
│       ├── dashboard.endpoints.ts
│       ├── designs.endpoints.ts
│       ├── products.endpoints.ts
│       ├── orders.endpoints.ts
│       └── index.ts
└── hooks/
    ├── api/
    │   ├── useDashboard.ts      # Hook React Query dashboard
    │   ├── useDesigns.ts
    │   ├── useProducts.ts
    │   ├── useOrders.ts
    │   └── index.ts
    └── ... (hooks existants)
```

## 🔧 COMPOSANTS

### 1. Unified API Client (`unified-client.ts`)
- Axios instance avec interceptors
- Gestion automatique cookies httpOnly
- Refresh token automatique
- Retry logic
- Error handling unifié

### 2. React Query Client (`query-client.ts`)
- Configuration QueryClient
- Defaults (staleTime, retry, etc.)
- DevTools (en dev)

### 3. Endpoints Typés (`endpoints/*.ts`)
- Types TypeScript stricts
- Validation Zod
- Documentation JSDoc

### 4. React Query Hooks (`hooks/api/*.ts`)
- useQuery pour GET
- useMutation pour POST/PUT/DELETE
- Cache automatique
- Optimistic updates

