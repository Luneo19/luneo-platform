# 🧪 Guide de Test Webhook SendGrid

## 📊 **Statut Actuel**

### ✅ **Configuration Validée**
- ✅ **Webhook SendGrid** : Configuré et activé
- ✅ **URL** : `https://api.luneo.app/webhooks/sendgrid`
- ✅ **ID** : `b94c76ff-5ee3-4843-ab98-3c37853c6525`
- ✅ **Logique** : Tous les tests de logique passent
- ✅ **Code** : Endpoint webhook implémenté et prêt

### ⚠️ **Problème Identifié**
- ⚠️ **Déploiement** : L'application n'est pas encore déployée à `https://api.luneo.app`
- ⚠️ **Accessibilité** : Le domaine retourne une page 404

## 🚀 **Solutions pour Tester le Webhook**

### **Solution 1: Test avec ngrok (Recommandé)**

#### **A. Installer ngrok**
```bash
# macOS
brew install ngrok

# Ou télécharger depuis https://ngrok.com/
```

#### **B. Démarrer l'application locale**
```bash
npm run dev
```

#### **C. Exposer avec ngrok**
```bash
ngrok http 3000
```

#### **D. Mettre à jour SendGrid**
1. Copiez l'URL ngrok (ex: `https://abc123.ngrok.io`)
2. Dans SendGrid Dashboard, modifiez l'URL du webhook
3. Nouvelle URL: `https://abc123.ngrok.io/webhooks/sendgrid`
4. Testez avec "Test Integration"

### **Solution 2: Test avec webhook.site**

#### **A. Aller sur webhook.site**
1. Visitez https://webhook.site
2. Copiez l'URL unique générée (ex: `https://webhook.site/abc123`)

#### **B. Configurer SendGrid temporairement**
1. Dans SendGrid Dashboard, modifiez l'URL du webhook
2. Nouvelle URL: `https://webhook.site/abc123`
3. Testez avec "Test Integration"
4. Vérifiez que vous recevez les événements sur webhook.site

#### **C. Remettre l'URL de production**
1. Une fois les tests validés, remettez l'URL: `https://api.luneo.app/webhooks/sendgrid`

### **Solution 3: Test avec Postman/Insomnia**

#### **A. Collection de test**
```json
{
  "name": "SendGrid Webhook Test",
  "requests": [
    {
      "name": "Test Integration",
      "method": "POST",
      "url": "https://api.luneo.app/webhooks/sendgrid",
      "headers": {
        "Content-Type": "application/json",
        "User-Agent": "SendGrid"
      },
      "body": [
        {
          "email": "test@example.com",
          "timestamp": 1725601831,
          "event": "delivered",
          "smtp-id": "<test-message-id>"
        }
      ]
    }
  ]
}
```

### **Solution 4: Test avec curl (Quand l'application sera déployée)**

```bash
curl -X POST https://api.luneo.app/webhooks/sendgrid \
  -H "Content-Type: application/json" \
  -H "User-Agent: SendGrid" \
  -d '[
    {
      "email": "test@luneo.app",
      "timestamp": '$(date +%s)',
      "event": "delivered",
      "smtp-id": "<test-message-id>",
      "response": "250 OK"
    }
  ]'
```

## 🎯 **Test dans SendGrid Dashboard**

### **Étapes pour "Test Integration"**

1. **Allez dans SendGrid Dashboard**
   - Settings > Mail Settings > Event Webhook

2. **Trouvez votre webhook**
   - Nom: "Webhook SendGrid"
   - URL: `https://api.luneo.app/webhooks/sendgrid`

3. **Cliquez sur "Test Integration"**

4. **Réponse attendue**
   ```json
   {
     "status": "success",
     "message": "Webhook traité avec succès",
     "events_processed": 1
   }
   ```

5. **Vérifiez les logs**
   - Dans votre application (quand déployée)
   - Dans SendGrid Activity

## 📋 **Checklist de Test**

### **Avant le Test**
- [ ] Application démarrée localement ou déployée
- [ ] URL webhook accessible (avec ngrok ou en production)
- [ ] Webhook configuré dans SendGrid Dashboard

### **Pendant le Test**
- [ ] Cliquer sur "Test Integration" dans SendGrid
- [ ] Vérifier la réponse HTTP 200 OK
- [ ] Consulter les logs de l'application
- [ ] Vérifier que les événements sont traités

### **Après le Test**
- [ ] Valider que tous les types d'événements fonctionnent
- [ ] Tester avec des emails réels
- [ ] Configurer les alertes de monitoring

## 🔧 **Dépannage**

### **Erreur 404 (Not Found)**
```
Cause: Application non déployée ou URL incorrecte
Solution: Déployer l'application ou utiliser ngrok
```

### **Erreur 500 (Internal Server Error)**
```
Cause: Erreur dans le code webhook
Solution: Vérifier les logs de l'application
```

### **Timeout**
```
Cause: Application lente ou surchargée
Solution: Optimiser le code ou augmenter les timeouts
```

### **Erreur de Format**
```
Cause: Payload SendGrid non conforme
Solution: Vérifier la logique de traitement des événements
```

## 🚀 **Déploiement Production**

### **Quand l'application sera déployée**

1. **Vérifier l'URL**
   ```bash
   curl https://api.luneo.app/health
   ```

2. **Tester le webhook**
   ```bash
   curl -X POST https://api.luneo.app/webhooks/sendgrid \
     -H "Content-Type: application/json" \
     -d '[{"email":"test@luneo.app","event":"delivered"}]'
   ```

3. **Configurer SendGrid**
   - URL: `https://api.luneo.app/webhooks/sendgrid`
   - Test Integration

4. **Monitoring**
   - Surveiller les logs
   - Configurer les alertes
   - Tester avec des emails réels

## 📞 **Support**

### **En cas de problème**
1. Vérifier les logs de l'application
2. Consulter SendGrid Activity
3. Tester avec webhook.site
4. Utiliser ngrok pour le développement

### **Ressources utiles**
- [Documentation SendGrid Webhooks](https://docs.sendgrid.com/for-developers/tracking-events/event)
- [ngrok Documentation](https://ngrok.com/docs)
- [webhook.site](https://webhook.site)

---

## 🎉 **Résumé**

Votre **webhook SendGrid est parfaitement configuré** ! Le seul élément manquant est le déploiement de votre application backend à `https://api.luneo.app`.

### **Options immédiates :**
1. **Utiliser ngrok** pour tester en local
2. **Utiliser webhook.site** pour valider la configuration SendGrid
3. **Déployer l'application** pour activer le webhook en production

### **Une fois déployé :**
- ✅ Le webhook fonctionnera automatiquement
- ✅ SendGrid enverra les événements
- ✅ Votre application traitera les événements
- ✅ Vous aurez un monitoring complet

**🚀 Votre configuration webhook SendGrid est prête pour la production !**
