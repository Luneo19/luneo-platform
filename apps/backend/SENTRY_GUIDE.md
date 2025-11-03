# 📊 GUIDE D'UTILISATION SENTRY

## 🎯 **Vue d'ensemble**

Sentry est configuré pour surveiller les erreurs, les performances et les logs de votre application NestJS.

## 🔗 **Liens Utiles**

- **Dashboard Sentry** : https://sentry.io
- **Project ID** : 4509948332998736
- **DSN** : https://9b98e0a9e22c4d2f88b22edf3d1c7ddf@o4509948310519808.ingest.de.sentry.io/4509948332998736

## 🚀 **Fonctionnalités Activées**

### 1. **Error Monitoring**
- Capture automatique des erreurs non gérées
- Stack traces détaillées
- Contexte d'exécution
- Breadcrumbs (logs, requêtes, etc.)

### 2. **Performance Monitoring**
- Traces des requêtes HTTP
- Temps de réponse
- Requêtes lentes
- Profiling des fonctions

### 3. **Environment Detection**
- `development` : Debug activé, 100% des traces
- `production` : Debug désactivé, 10% des traces
- `test` : Pas de traces, debug désactivé

## 📊 **Dashboard Sentry**

### **Sections Principales**

1. **Issues** - Erreurs et problèmes
2. **Performance** - Métriques de performance
3. **Releases** - Versions déployées
4. **Users** - Utilisateurs affectés
5. **Logs** - Logs structurés

### **Métriques Importantes**

- **Error Rate** : Taux d'erreur
- **Apdex** : Score de satisfaction utilisateur
- **Throughput** : Nombre de requêtes/minute
- **Response Time** : Temps de réponse moyen

## 🔧 **Configuration par Environnement**

### **Development**
```javascript
{
  environment: 'development',
  debug: true,
  tracesSampleRate: 1.0, // 100% des traces
  profilesSampleRate: 1.0, // 100% des profils
  sendDefaultPii: true // Données personnelles incluses
}
```

### **Production**
```javascript
{
  environment: 'production',
  debug: false,
  tracesSampleRate: 0.1, // 10% des traces
  profilesSampleRate: 0.1, // 10% des profils
  sendDefaultPii: false // Pas de données personnelles
}
```

## 🎯 **Utilisation dans le Code**

### **Capturer une Erreur Manuellement**
```typescript
import * as Sentry from '@sentry/nestjs';

try {
  // Code qui peut échouer
} catch (error) {
  Sentry.captureException(error);
  throw error;
}
```

### **Ajouter du Contexte**
```typescript
Sentry.setContext('user', {
  id: user.id,
  email: user.email,
  brandId: user.brandId
});

Sentry.setTag('operation', 'design-generation');
```

### **Créer un Span Personnalisé**
```typescript
const transaction = Sentry.startTransaction({
  name: 'design-generation',
  op: 'ai.processing'
});

try {
  // Code de génération
  transaction.setStatus('ok');
} catch (error) {
  transaction.setStatus('internal_error');
  throw error;
} finally {
  transaction.finish();
}
```

## 📈 **Alertes et Notifications**

### **Alertes Recommandées**

1. **Error Rate > 5%** - Taux d'erreur élevé
2. **Response Time > 2s** - Temps de réponse lent
3. **New Issues** - Nouvelles erreurs
4. **High Priority Issues** - Erreurs critiques

### **Configuration des Alertes**

1. Aller dans **Alerts** dans Sentry
2. Cliquer sur **Create Alert Rule**
3. Configurer les conditions
4. Choisir les canaux de notification (email, Slack, etc.)

## 🔄 **Releases et Déploiements**

### **Créer une Release**
```bash
npm run sentry:release
```

### **Uploader les Source Maps**
```bash
npm run sentry:upload-sourcemaps
```

### **Intégration CI/CD**

Ajouter dans votre pipeline de déploiement :
```yaml
- name: Create Sentry Release
  run: npm run sentry:release
  
- name: Upload Source Maps
  run: npm run sentry:upload-sourcemaps
```

## 🛠️ **Dépannage**

### **Erreurs Communes**

1. **DSN invalide** : Vérifier la configuration dans `.env`
2. **Source maps manquantes** : Exécuter `npm run sentry:upload-sourcemaps`
3. **Erreurs non capturées** : Vérifier que `SentryGlobalFilter` est configuré

### **Debug Mode**

En développement, activer le debug :
```javascript
Sentry.init({
  dsn: "...",
  debug: true
});
```

## 📚 **Ressources**

- [Documentation Sentry](https://docs.sentry.io/)
- [NestJS Integration](https://docs.sentry.io/platforms/node/guides/nestjs/)
- [Performance Monitoring](https://docs.sentry.io/product/performance/)
- [Error Monitoring](https://docs.sentry.io/product/error-monitoring/)

---

**🎉 Sentry est maintenant pleinement opérationnel pour votre backend !**









