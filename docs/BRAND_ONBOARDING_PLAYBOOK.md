# 🚀 PLAYBOOK D'ONBOARDING BRAND - LUNEO ENTERPRISE

## 📋 Vue d'ensemble

Ce playbook détaille le processus complet d'onboarding d'une nouvelle marque (brand) sur la plateforme Luneo Enterprise, de l'inscription initiale à la mise en production.

---

## 🎯 Étapes d'Onboarding

### **Phase 1 : Inscription & Validation (1-2 jours)**

#### 1.1 Inscription Initiale
```bash
# Création du brand via l'API Admin
curl -X POST https://api.luneo.app/v1/admin/brands \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Nouvelle Marque",
    "slug": "nouvelle-marque",
    "description": "Description de la marque",
    "website": "https://nouvelle-marque.com",
    "contactEmail": "contact@nouvelle-marque.com"
  }'
```

#### 1.2 Validation KYC/Compliance
- [ ] **Vérification de l'entreprise**
  - SIRET/VAT Number
  - Adresse légale
  - Documents de constitution
- [ ] **Vérification bancaire**
  - RIB/IBAN
  - Preuve de domiciliation
- [ ] **Validation des conditions d'utilisation**
  - Signature électronique du contrat
  - Acceptation des CGU/CGV

#### 1.3 Activation du Brand
```bash
# Activation après validation
curl -X PATCH https://api.luneo.app/v1/admin/brands/{brandId} \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "VERIFIED",
    "plan": "professional"
  }'
```

---

### **Phase 2 : Configuration SSO (2-3 jours)**

#### 2.1 Configuration SAML (si requis)
```yaml
# Configuration SAML pour le brand
saml_config:
  entity_id: "https://nouvelle-marque.com/saml"
  sso_url: "https://nouvelle-marque.com/saml/sso"
  x509_certificate: "-----BEGIN CERTIFICATE-----..."
  attribute_mapping:
    email: "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress"
    firstName: "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/givenname"
    lastName: "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/surname"
```

#### 2.2 Test SSO
```bash
# Test de connexion SSO
curl -X POST https://api.luneo.app/v1/auth/sso/saml/test \
  -H "Content-Type: application/json" \
  -d '{
    "brandId": "brand_123",
    "samlResponse": "ENCODED_SAML_RESPONSE"
  }'
```

#### 2.3 Configuration SCIM (provisioning utilisateurs)
```json
{
  "scim_endpoint": "https://api.luneo.app/v1/scim/{brandId}",
  "auth_token": "scim_token_123",
  "user_sync": {
    "enabled": true,
    "sync_interval": "1h",
    "auto_create_users": true,
    "auto_deactivate_users": true
  }
}
```

---

### **Phase 3 : Création des Clés API (1 jour)**

#### 3.1 Génération des Clés API
```bash
# Création de la clé API principale
curl -X POST https://api.luneo.app/v1/admin/brands/{brandId}/api-keys \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Production API Key",
    "permissions": ["designs:create", "designs:read", "orders:create"],
    "rateLimit": {
      "requestsPerMinute": 100,
      "requestsPerHour": 1000
    },
    "allowedIPs": ["203.0.113.0/24"]
  }'
```

#### 3.2 Configuration des Webhooks
```bash
# Configuration des webhooks
curl -X POST https://api.luneo.app/v1/admin/brands/{brandId}/webhooks \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://nouvelle-marque.com/webhooks/luneo",
    "events": ["design.completed", "design.failed", "order.created", "order.paid"],
    "secret": "webhook_secret_123",
    "enabled": true
  }'
```

---

### **Phase 4 : Configuration des Produits (2-3 jours)**

#### 4.1 Import du Catalogue
```bash
# Import en masse des produits
curl -X POST https://api.luneo.app/v1/brands/{brandId}/products/import \
  -H "Authorization: Bearer API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "products": [
      {
        "name": "Bracelet Personnalisé",
        "description": "Bracelet en cuir avec gravure personnalisée",
        "sku": "BRACELET-001",
        "price": 29.99,
        "currency": "EUR",
        "images": ["https://cdn.nouvelle-marque.com/bracelet-1.jpg"],
        "customizationOptions": {
          "engraving": {
            "maxLength": 20,
            "fonts": ["script-cursive", "block", "serif"],
            "positions": ["center", "top", "bottom"]
          },
          "material": {
            "options": ["leather", "steel", "gold"],
            "default": "leather"
          }
        }
      }
    ]
  }'
```

#### 4.2 Configuration des Templates 3D
```bash
# Upload des modèles 3D
curl -X POST https://api.luneo.app/v1/brands/{brandId}/products/{productId}/3d-model \
  -H "Authorization: Bearer API_KEY" \
  -F "file=@bracelet-template.glb" \
  -F "config={\"engravingArea\": {\"x\": 0, \"y\": 0, \"z\": 0, \"width\": 50, \"height\": 10}}"
```

#### 4.3 Configuration des Zones de Gravure
```json
{
  "engraving_areas": [
    {
      "name": "center_plate",
      "position": {"x": 0, "y": 0, "z": 0},
      "size": {"width": 50, "height": 10, "depth": 0.6},
      "constraints": {
        "maxLength": 20,
        "allowedFonts": ["script-cursive", "block"],
        "minFontSize": 8,
        "maxFontSize": 14
      }
    }
  ]
}
```

---

### **Phase 5 : Intégration Frontend (3-5 jours)**

#### 5.1 Installation du SDK Widget
```html
<!-- Intégration du widget Luneo -->
<script src="https://widget.luneo.app/v1/sdk.js"></script>
<script>
  const luneoWidget = new LuneoWidget({
    apiKey: 'your-api-key',
    brandId: 'brand_123',
    productId: 'product_456',
    container: '#luneo-widget',
    options: {
      theme: 'dark',
      language: 'fr',
      currency: 'EUR',
      onDesignComplete: (design) => {
        console.log('Design créé:', design);
        // Ajouter au panier ou rediriger
      }
    }
  });
</script>
```

#### 5.2 Configuration du Thème
```javascript
// Personnalisation du thème
const theme = {
  primaryColor: '#3B82F6',
  secondaryColor: '#1E40AF',
  backgroundColor: '#FFFFFF',
  textColor: '#1F2937',
  borderRadius: '8px',
  fontFamily: 'Inter, sans-serif',
  logo: 'https://nouvelle-marque.com/logo.png'
};

luneoWidget.setTheme(theme);
```

#### 5.3 Intégration des Webhooks
```javascript
// Gestion des webhooks côté brand
app.post('/webhooks/luneo', (req, res) => {
  const signature = req.headers['x-luneo-signature'];
  const payload = req.body;
  
  // Vérification de la signature
  if (!verifySignature(payload, signature, webhookSecret)) {
    return res.status(401).send('Invalid signature');
  }
  
  const { event, data } = payload;
  
  switch (event) {
    case 'design.completed':
      // Notifier l'utilisateur
      notifyUser(data.userId, 'Votre design est prêt !');
      break;
      
    case 'order.paid':
      // Déclencher la fabrication
      startManufacturing(data.orderId);
      break;
  }
  
  res.status(200).send('OK');
});
```

---

### **Phase 6 : Tests & Validation (2-3 jours)**

#### 6.1 Tests Fonctionnels
```bash
# Test de création de design
curl -X POST https://api.luneo.app/v1/designs \
  -H "Authorization: Bearer API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "productId": "product_456",
    "prompt": "Grave 'Test' en script cursif au centre",
    "options": {
      "font": "script-cursive",
      "position": "center",
      "material": "gold"
    },
    "previewMode": true
  }'
```

#### 6.2 Tests de Performance
```bash
# Test de charge
wrk -t12 -c400 -d30s --script=load-test.lua https://api.luneo.app/v1/designs
```

#### 6.3 Tests de Sécurité
- [ ] Test d'injection de prompts malveillants
- [ ] Validation des limites de taux
- [ ] Test des permissions API
- [ ] Audit des logs de sécurité

---

### **Phase 7 : Formation & Documentation (1-2 jours)**

#### 7.1 Formation Technique
- [ ] **Session API** (2h)
  - Endpoints principaux
  - Authentification
  - Gestion des erreurs
  - Best practices
- [ ] **Session Frontend** (2h)
  - Intégration du widget
  - Personnalisation
  - Gestion des événements
- [ ] **Session Webhooks** (1h)
  - Configuration
  - Gestion des événements
  - Debugging

#### 7.2 Documentation Brand-Specific
```markdown
# Documentation pour Nouvelle Marque

## Configuration API
- Clé API : `luneo_live_...`
- Webhook Secret : `whsec_...`
- Rate Limits : 100 req/min, 1000 req/h

## Endpoints Personnalisés
- Design Creation : POST /v1/designs
- Order Management : POST /v1/orders
- Webhook Endpoint : https://nouvelle-marque.com/webhooks/luneo

## Exemples de Code
[Exemples spécifiques au brand]
```

---

### **Phase 8 : Mise en Production (1 jour)**

#### 8.1 Checklist Pré-Production
- [ ] **Infrastructure**
  - Serveurs configurés
  - Monitoring activé
  - Backups configurés
- [ ] **Sécurité**
  - Certificats SSL installés
  - Firewall configuré
  - Secrets managés
- [ ] **Performance**
  - CDN configuré
  - Cache activé
  - Load balancer configuré

#### 8.2 Go-Live
```bash
# Activation finale
curl -X PATCH https://api.luneo.app/v1/admin/brands/{brandId} \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "ACTIVE",
    "productionReady": true,
    "goLiveDate": "2024-01-15T00:00:00Z"
  }'
```

---

## 📊 Métriques de Succès

### KPIs d'Onboarding
- **Temps d'onboarding moyen** : < 7 jours
- **Taux de réussite** : > 95%
- **Satisfaction client** : > 4.5/5
- **Temps de résolution des problèmes** : < 24h

### Métriques Post-Go-Live
- **Uptime** : > 99.9%
- **Latence API** : < 200ms (p95)
- **Taux d'erreur** : < 0.1%
- **Adoption des fonctionnalités** : > 80%

---

## 🛠️ Outils & Ressources

### Outils Internes
- **Admin Dashboard** : https://admin.luneo.app
- **API Documentation** : https://docs.luneo.app
- **Status Page** : https://status.luneo.app
- **Support Portal** : https://support.luneo.app

### Ressources Client
- **SDK Documentation** : https://docs.luneo.app/sdk
- **Integration Guides** : https://docs.luneo.app/integration
- **Best Practices** : https://docs.luneo.app/best-practices
- **Support Email** : api-support@luneo.app

### Templates de Communication
```markdown
# Email de Bienvenue

Bonjour [Brand Name],

Bienvenue sur Luneo Enterprise ! 

Votre compte a été activé avec succès :
- Brand ID : brand_123
- Plan : Professional
- API Key : luneo_live_...

Prochaines étapes :
1. Configuration SSO (si applicable)
2. Import de votre catalogue produits
3. Intégration du widget
4. Tests en sandbox
5. Mise en production

Votre Customer Success Manager : [Name] ([email])

Cordialement,
L'équipe Luneo
```

---

## 🚨 Escalation & Support

### Niveaux de Support
1. **L1 - Support Général** : Questions basiques, documentation
2. **L2 - Support Technique** : Problèmes d'intégration, bugs
3. **L3 - Support Avancé** : Problèmes complexes, escalade engineering

### Contacts d'Escalation
- **Customer Success** : success@luneo.app
- **Technical Support** : tech-support@luneo.app
- **Engineering** : engineering@luneo.app
- **Emergency** : +33 1 23 45 67 89

### SLA
- **L1** : 4h en heures ouvrées
- **L2** : 2h en heures ouvrées
- **L3** : 1h 24/7
- **Emergency** : 30min 24/7

