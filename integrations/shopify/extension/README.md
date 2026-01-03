# Luneo Shopify Theme App Extension

Extension de thème Shopify pour intégrer le widget Luneo dans les pages produits.

## Installation

1. **Via Shopify CLI** :
```bash
cd apps/shopify
shopify app generate extension
# Sélectionner "Theme app extension"
# Copier les fichiers de integrations/shopify/extension/
```

2. **Ou copier les fichiers** dans votre app Shopify existante :
```bash
cp -r integrations/shopify/extension/* apps/shopify/extensions/luneo-customizer/
```

## Déploiement

```bash
cd apps/shopify
shopify app deploy
```

## Configuration

1. **API Key** : Configurer dans les metafields du shop :
   - Namespace: `luneo`
   - Key: `api_key`
   - Value: Votre clé API Luneo

2. **Widget URL** : Par défaut utilise le CDN, peut être personnalisé dans les settings du block

## Utilisation

1. Aller dans l'éditeur de thème Shopify
2. Ajouter le block "Luneo Customizer" à la page produit
3. Configurer les options (couleurs, texte, etc.)
4. Publier le thème

## Structure

```
extension/
├── assets/
│   └── luneo-customizer.js    # Helper script
├── blocks/
│   └── customizer.liquid      # Block Liquid principal
├── locales/
│   ├── en.default.json        # Traductions EN
│   └── fr.json                # Traductions FR
└── shopify.extension.toml      # Configuration extension
```

## Fonctionnalités

- ✅ Intégration widget embarqué (pas d'iframe)
- ✅ Modal responsive
- ✅ Ajout au panier avec données de personnalisation
- ✅ Support multi-variantes
- ✅ Traductions EN/FR
- ✅ Personnalisation du bouton (couleurs, texte, taille)
