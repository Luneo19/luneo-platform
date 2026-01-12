# Luneo API - Postman Collection

Collection Postman complète pour l'API publique Luneo.

## 📥 Importation

### Option 1 : Import depuis fichier

1. Ouvrez Postman
2. Cliquez sur **Import**
3. Sélectionnez le fichier `Luneo-API.postman_collection.json`
4. Cliquez sur **Import**

### Option 2 : Import depuis URL

1. Ouvrez Postman
2. Cliquez sur **Import**
3. Collez l'URL de la collection (si hébergée)
4. Cliquez sur **Import**

## 🔧 Configuration

### Variables d'environnement

Créez un environnement Postman avec les variables suivantes :

- `base_url` : `https://api.luneo.com/api/v1` (ou votre URL de staging)
- `api_key` : Votre clé API Luneo

### Configuration de l'authentification

L'authentification est configurée au niveau de la collection avec :
- **Type** : API Key
- **Key** : `X-API-Key`
- **Value** : `{{api_key}}`

Vous pouvez également définir `api_key` dans vos variables d'environnement.

## 📋 Endpoints Disponibles

### Health
- `GET /health` - Vérification de l'état de l'API

### Products
- `GET /products` - Liste des produits
- `GET /products/:productId` - Détails d'un produit

### Designs
- `POST /designs` - Créer un design avec IA
- `GET /designs/:designId` - Statut d'un design

### Orders
- `POST /orders` - Créer une commande
- `GET /orders/:orderId` - Détails d'une commande
- `POST /orders/:orderId/cancel` - Annuler une commande

### Analytics
- `GET /analytics/overview` - Vue d'ensemble des analytics

## 🚀 Utilisation

### Exemple : Créer un design

1. Ouvrez la requête **Designs > Create Design**
2. Modifiez le body JSON avec vos valeurs :
   ```json
   {
     "productId": "prod_123",
     "prompt": "Votre description de design",
     "options": {
       "material": "gold",
       "size": "M"
     }
   }
   ```
3. Cliquez sur **Send**
4. Copiez le `designId` de la réponse
5. Utilisez-le dans **Get Design** pour vérifier le statut

### Exemple : Créer une commande

1. Créez d'abord un design (voir ci-dessus)
2. Ouvrez **Orders > Create Order**
3. Modifiez le body JSON avec :
   - Le `designId` créé précédemment
   - Les informations de livraison
4. Cliquez sur **Send**
5. Utilisez le `paymentUrl` pour le paiement

## 🔄 Tests Automatiques

La collection inclut des tests automatiques pour :
- Vérification des codes de statut
- Validation des réponses JSON
- Vérification des headers de rate limiting

## 📚 Documentation

Pour plus d'informations, consultez :
- [Documentation API](https://docs.luneo.com/api)
- [Guide de démarrage](https://docs.luneo.com/getting-started)

## 🆘 Support

- **Email** : api-support@luneo.com
- **Documentation** : https://docs.luneo.com
