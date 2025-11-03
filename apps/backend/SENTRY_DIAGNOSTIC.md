# 🔍 GUIDE DE DIAGNOSTIC SENTRY

## 🚨 **Problèmes Courants et Solutions**

### 1. **Avertissement "Discarded session"**

**Symptôme :**
```
Sentry Logger [warn]: Discarded session because of missing or non-string release
```

**Cause :** Sentry ne peut pas créer de sessions sans version définie.

**Solution :**
```javascript
Sentry.init({
  dsn: "...",
  release: process.env.npm_package_version || '1.0.0',
  // ...
});
```

### 2. **Erreurs non capturées**

**Symptôme :** Les erreurs n'apparaissent pas dans Sentry.

**Vérifications :**
- [ ] DSN correct dans les variables d'environnement
- [ ] `SentryGlobalFilter` configuré dans `app.module.ts`
- [ ] `instrument.ts` importé au début de `main.ts`
- [ ] Pas de blocage réseau/firewall

**Test rapide :**
```bash
node test-sentry-enhanced.js
```

### 3. **Performance monitoring ne fonctionne pas**

**Symptôme :** Pas de données de performance dans Sentry.

**Vérifications :**
- [ ] `tracesSampleRate > 0`
- [ ] Transactions créées avec `Sentry.startTransaction()`
- [ ] Spans correctement fermés avec `.finish()`

### 4. **Logs non envoyés**

**Symptôme :** Les `console.log` n'apparaissent pas dans Sentry.

**Vérifications :**
- [ ] `enableLogs: true`
- [ ] `consoleLoggingIntegration` configuré
- [ ] Niveaux de logs corrects dans l'intégration

## 🔧 **Tests de Diagnostic**

### Test 1: Configuration de base
```bash
cd backend
node test-sentry.js
```

### Test 2: Test complet
```bash
cd backend
node test-sentry-enhanced.js
```

### Test 3: Test avec variables d'environnement
```bash
cd backend
SENTRY_DSN="votre-dsn" SENTRY_ENVIRONMENT="test" node test-sentry-enhanced.js
```

## 📊 **Vérification Dashboard**

### Dans Sentry, vérifiez :

1. **Issues** - Erreurs capturées
2. **Performance** - Transactions et spans
3. **Releases** - Versions déployées
4. **Logs** - Messages et breadcrumbs
5. **Users** - Utilisateurs affectés

### Métriques importantes :
- **Error Rate** : Doit être < 5%
- **Apdex** : Doit être > 0.8
- **Response Time** : Doit être < 2s

## 🛠️ **Commandes Utiles**

### Vérifier la configuration
```bash
# Vérifier les variables d'environnement
grep SENTRY .env*

# Vérifier la configuration Sentry
node -e "console.log(require('./sentry.config.js').sentryConfig)"
```

### Créer une release
```bash
npm run sentry:release
```

### Uploader les source maps
```bash
npm run sentry:upload-sourcemaps
```

## 🔍 **Debug Mode**

Pour activer le debug Sentry :
```javascript
Sentry.init({
  dsn: "...",
  debug: true,
  // ...
});
```

Cela affichera des logs détaillés dans la console.

## 📞 **Support**

Si les problèmes persistent :

1. Vérifiez les logs de debug
2. Testez avec le script de diagnostic
3. Vérifiez la documentation Sentry
4. Contactez le support Sentry avec les logs

## 🔗 **Liens Utiles**

- [Documentation Sentry](https://docs.sentry.io/)
- [NestJS Integration](https://docs.sentry.io/platforms/node/guides/nestjs/)
- [Troubleshooting Guide](https://docs.sentry.io/platforms/node/troubleshooting/)
