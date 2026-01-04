# Spécifications Exactes - Hero Banner

Basé sur l'image de référence fournie, ce document détaille les mesures exactes à implémenter.

## 📐 Mesures Générales

### Viewport
- **Largeur**: 1920px (standard desktop)
- **Hauteur**: 1080px (min-height: 100vh)
- **Background**: Noir profond avec étoiles (#000000 ou #0a0a0a)

## 👤 Figure Humanoïde

### Position
- **Position**: À droite de l'écran
- **right**: ~5% (à ajuster selon image)
- **top**: 50% (centré verticalement)
- **Taille**: 
  - Largeur: ~550px (40vw max)
  - Hauteur: ~800px (60vw max)

### Caractéristiques Visuelles
- **Type**: Féminine, vue de profil à droite
- **Effet**: Translucide/holographique avec texture filaire
- **Couleur principale**: Blanc/bleu lumineux
  - RGB principal: rgba(255, 255, 255, 0.6-0.7)
  - Bleu: rgba(147, 197, 253, 0.4-0.5)
- **Structure interne**: Réseau neuronal/lignes de données

### Bras et Main
- **Main pointante**: DROITE (pas gauche!)
- **Position doigt**: Pointant vers le centre (vers la gauche)
- **Index**: Glow intense blanc (rgba(255, 255, 255, 0.95))
- **Halo autour doigt**: 
  - Cercle 1: r=25px, stroke rgba(255, 255, 255, 0.8)
  - Cercle 2: r=35px, stroke rgba(147, 197, 253, 0.6)

### Lunettes
- **Style**: Semi-transparentes, bleues
- **Couleur**: rgba(147, 197, 253, 0.7)
- **Position**: Sur le visage (vue de profil)
- **Glow**: Intensité moyenne avec filter

## 💎 Bijoux Flottants

### Positions (À MESURER PRÉCISÉMENT)
1. **Bague 1** (grande, diamant bleu)
   - Position: En haut à gauche
   - Taille: ~120px
   
2. **Bague 2** (simple)
   - Position: En bas à gauche
   - Taille: ~100px

3. **Bague 3** (avec bande gravée)
   - Position: Au centre-droite
   - Taille: ~90px

4. **Collier 1** (grand pendentif circulaire)
   - Position: Centre-gauche, touché par le doigt
   - Taille: ~150px
   - Support holographique visible

5. **Collier 2** (pendentif cœur)
   - Position: En bas, centre-gauche
   - Taille: ~130px

6. **Lunettes** (affichage produit)
   - Position: En haut, centre-gauche
   - Taille: ~140px

### Caractéristiques
- **Effet**: Translucide, holographique
- **Glow**: Bleu/blanc
- **Animation**: Flottement subtil
- **Opacité**: 0.6-0.8

## ☁️ Nuage "Prompt"

### Position
- **left**: ~28% (à mesurer précisément)
- **top**: ~25% (à mesurer précisément)
- **Taille**: ~200px largeur, ~150px hauteur

### Contenu
- **Texte "Prompt"**: 
  - Police: System font, bold
  - Couleur: rgba(255, 255, 255, 0.9)
  - Taille: ~24px
- **Texte "A/A"**: 
  - Position: Sous "Prompt"
  - Couleur: rgba(147, 197, 253, 0.8)
  - Taille: ~18px
- **Flèches**: 4 flèches autour, rotatives

### Connexions
- Flèches vers:
  - Icône settings/gear
  - Icône réseau/connection
  - Autres éléments (à identifier)

## 📄 Panneaux de Code

### Positions (À MESURER)
- Panel 1: En haut à droite
- Panel 2: Centre-droite
- Panel 3: Bas-gauche
- Panel 4: Haut-gauche

### Style
- **Background**: rgba(0, 0, 0, 0.3)
- **Border**: rgba(255, 255, 255, 0.15)
- **Backdrop-filter**: blur(8px)
- **Police**: Monaco/Menlo/Courier, ~0.7rem
- **Couleur texte**: rgba(147, 197, 253, 0.7)
- **Taille**: ~200px largeur

### Contenu
- Lignes de code/data
- Textes variés selon panel
- Style terminal/modern

## 🔍 Barre de Recherche

### Position
- **right**: ~20% (à mesurer)
- **top**: ~38% (près du cou de la figure)
- **Style**: Flottante, translucide

### Caractéristiques
- **Background**: rgba(255, 255, 255, 0.1)
- **Backdrop-filter**: blur(10px)
- **Border**: rgba(255, 255, 255, 0.2)
- **Border-radius**: 12px
- **Icône**: Recherche à gauche

## ⭐ Fond Étoilé

### Caractéristiques
- **Nombre d'étoiles**: ~80-120
- **Couleur**: Blanc (rgba(255, 255, 255, 1))
- **Taille**: 0.3-0.9px
- **Opacité**: 0.2-0.5 (variation)
- **Animation**: Scintillement subtil
- **Distribution**: Aléatoire mais harmonieuse

## 🎯 Objet Touché (Collier)

### Caractéristiques
- **Position**: Centre-gauche, exactement où le doigt pointe
- **Type**: Collier avec grand pendentif circulaire
- **Support**: Holographique (stand translucide)
- **Taille**: ~120-150px
- **Glow intense**: Lumière blanche autour du point de contact
- **Effet**: Lens flare au point de contact

## 📊 Z-Index Hierarchy

1. **Background stars**: z-index 1
2. **Background image**: z-index 2
3. **Overlay**: z-index 3
4. **Floating elements container**: z-index 5
5. **Humanoid figure**: z-index 6
6. **Products**: z-index 7
7. **Prompt cloud**: z-index 8
8. **Code panels**: z-index 9
9. **Floating object (collier)**: z-index 10
10. **Search bar**: z-index 15
11. **Content**: z-index 10-20
12. **Navigation**: z-index 100

## 🎨 Couleurs Exactes (À EXTRUIRE DE L'IMAGE)

### Bleus Principaux
- Bleu clair: rgba(147, 197, 253, X) // #93C5FD
- Bleu moyen: rgba(59, 130, 246, X) // #3B82F6
- Bleu foncé: rgba(30, 64, 175, X) // #1E40AF

### Blancs
- Blanc pur: rgba(255, 255, 255, 0.9-1.0)
- Blanc translucide: rgba(255, 255, 255, 0.6-0.7)
- Blanc très translucide: rgba(255, 255, 255, 0.2-0.4)

### Backgrounds
- Noir fond: #000000 ou #0a0a0a
- Overlay: rgba(0, 0, 0, 0.2-0.4)

## 🔧 Actions Requises

1. **OBTENIR L'IMAGE** pour mesures précises
2. Mesurer toutes les positions X/Y
3. Extraire couleurs RGB exactes
4. Mesurer tailles précises
5. Identifier tous les détails visuels
6. Ajuster chaque composant
7. Valider pixel par pixel

## 📝 Notes

- Cette spécification sera mise à jour avec les mesures exactes une fois l'image obtenue
- Tous les pourcentages et pixels sont des estimations basées sur la description
- **IMPORTANT**: Besoin de l'image visuelle pour précision millimétrique










