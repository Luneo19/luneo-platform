# Luneo Product Customizer - Plugin WooCommerce

Plugin WordPress/WooCommerce pour intégrer le widget Luneo dans votre boutique.

## Installation

1. **Télécharger le plugin** :
```bash
cd woocommerce-plugin
zip -r luneo-customizer.zip . -x "*.git*" "node_modules/*"
```

2. **Installer dans WordPress** :
   - Aller dans WordPress Admin > Extensions > Ajouter
   - Téléverser `luneo-customizer.zip`
   - Activer le plugin

3. **Configurer** :
   - Aller dans Réglages > Luneo Customizer
   - Entrer votre clé API Luneo
   - Configurer les options du bouton

## Configuration

### API Key
Obtenez votre clé API depuis le [Dashboard Luneo](https://luneo.app/settings)

### Widget URL
Par défaut : `https://cdn.luneo.app/widget/v1/luneo-widget.iife.js`
Peut être personnalisé pour utiliser une version locale ou un CDN personnalisé.

## Fonctionnalités

- ✅ Widget embarqué directement (pas d'iframe)
- ✅ Intégration native WooCommerce
- ✅ Ajout au panier avec données de personnalisation
- ✅ Affichage dans le panier et les commandes
- ✅ Support des variantes de produits
- ✅ Personnalisation du bouton
- ✅ Traductions i18n

## Structure

```
woocommerce-plugin/
├── luneo-customizer.php    # Plugin principal
├── js/
│   └── luneo-widget.js     # Script frontend
└── README.md
```

## Hooks Utilisés

- `woocommerce_before_add_to_cart_button` - Affiche le bouton
- `woocommerce_add_cart_item_data` - Ajoute les données au panier
- `woocommerce_get_item_data` - Affiche dans le panier
- `woocommerce_checkout_create_order_line_item` - Sauvegarde dans la commande

## Compatibilité

- WordPress: 5.8+
- WooCommerce: 6.0+
- PHP: 7.4+






