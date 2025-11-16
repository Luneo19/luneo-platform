# Feature Flags & Expérimentation

## 1. Configuration

- Les flags sont définis au niveau backend via la variable d’environnement `FEATURE_FLAGS`.  
- Format supporté :
  - JSON : `{"realtime_monitoring": true, "demo_mode": false}`  
  - Liste : `realtime_monitoring:true, demo_mode:false`
- Exemple (staging) :  
  `FEATURE_FLAGS={"realtime_monitoring":true,"demo_mode":true,"sdk_beta":false}`

## 2. Backend

- Module : `FeatureFlagsModule` (`GET /feature-flags`).  
- Service (`FeatureFlagsService`) charge les flags depuis la config et expose `isEnabled(flag)`.  
- Endpoint `POST /feature-flags/reload` (auth requise) pour recharger les variables à chaud si elles changent (ex : via `kubectl set env`).

## 3. Frontend

- Context `FeatureFlagProvider` (dans `app/providers.tsx`).  
- Hooks :
  - `useFeatureFlags()` → map complet + date de mise à jour.
  - `useFeatureFlag('flag_name', fallback)` → booléen.
- Les pages / composants vérifient les flags avant de rendre (ex. `ObservabilityDashboard` dépend de `realtime_monitoring`).

## 4. Bonnes pratiques

- **Nomenclature** : snake_case (`realtime_monitoring`, `ai_batching`).  
- **Cycle de vie** : flag ajouté → documenté → activé selon environnements → supprimé une fois stabilisé.  
- **Experimentation** : pour l’AB testing, brancher GrowthBook/Unleash en lecture des mêmes flags ou dérivés.

## 5. CI/CD

- Vérifier la présence de la variable `FEATURE_FLAGS` dans les manifestes (staging, production).  
- Pour l’environnement local, définir dans `.env` :
  ```
  FEATURE_FLAGS={"realtime_monitoring":true,"demo_mode":true}
  ```

## 6. Roadmap

- Intégrer GrowthBook SaaS pour AB tests multi-variantes.  
- Ajouter API admin pour activer/désactiver flags runtime (avec audit).  
- Persisting per-user overrides (desktop app / mobile).

