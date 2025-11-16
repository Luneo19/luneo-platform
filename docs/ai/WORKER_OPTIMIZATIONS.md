# Optimisations Worker IA (Sprint C)

## 1. Prompt Caching

- Nouveau cache Redis (`PROMPT_CACHE_TTL_SECONDS`, défaut 600s).  
- Hash SHA-256 basé sur `prompt + style + dimensions + quality`.  
- Contenu : image PNG & thumbnail JPEG encodés base64 + métadonnées.  
- Même requête → réutilisation des buffers en re-uploadant vers le nouveau design (pas de nouvel appel OpenAI).  
- Désactiver le cache : `PROMPT_CACHE_TTL_SECONDS=0`.

## 2. Micro-batching

- Les jobs identiques en file d'attente partagent un `Promise` commun (`pendingGenerations`).  
- Quand un job est déjà en cours pour un prompt donné, les suivants attendent la fin au lieu de relancer l'inférence.

## 3. Journalisation & Observabilité

- Logs informant des hits cache / partage en cours.  
- Les métriques BullMQ (Sprint A) permettent de suivre la réduction du backlog IA.  
- TODO : exposer métriques spécifiques (ratio cache hits).

## 4. Roadmap

- Externaliser le cache dans Redis Cluster / Upstash (actuellement local).  
- Support multi-modèles (OpenAI, Stability) avec stratégie de fallback.  
- Monitoring de coût IA (€/image) couplé au mode démo / quotas.

