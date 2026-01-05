# 🚀 Guide d'Optimisation des Performances Cursor

## 📊 Problèmes Identifiés

Votre projet avait plusieurs problèmes qui ralentissaient Cursor:

1. **3246 fichiers markdown** - Beaucoup d'audits/rapports obsolètes
2. **64 fichiers markdown à la racine** - Fichiers de documentation temporaires
3. **Dossier .git volumineux** (806M) - Historique avec beaucoup de fichiers supprimés
4. **Fichiers de cache Next.js volumineux** - Caches webpack non nettoyés

## ✅ Optimisations Appliquées

### 1. Amélioration du `.gitignore`
- Exclusion des fichiers de cache Next.js volumineux (`.next/cache/`, `*.pack`)
- Exclusion des fichiers JSON volumineux (sauf configs essentielles)
- Exclusion des fichiers markdown d'audit/rapport obsolètes à la racine
- Conservation uniquement des fichiers essentiels

### 2. Script de Nettoyage Automatique
Un script `scripts/optimize-cursor-performance.sh` a été créé pour:
- Nettoyer les caches Next.js
- Supprimer les fichiers de cache webpack
- Nettoyer les fichiers TypeScript build info
- Nettoyer le cache Turbo
- Analyser les fichiers volumineux

### 3. Recommandations

#### Nettoyage Immédiat
```bash
# Exécuter le script de nettoyage
bash scripts/optimize-cursor-performance.sh
```

#### Archiver les Fichiers Markdown Obsolètes
Si vous avez beaucoup de fichiers markdown d'audit/rapport obsolètes, vous pouvez les archiver:

```bash
# Créer un dossier archive
mkdir -p archive/old-docs

# Déplacer les fichiers obsolètes (exemple)
mv AUDIT_*.md archive/old-docs/ 2>/dev/null || true
mv RAPPORT_*.md archive/old-docs/ 2>/dev/null || true
mv RESUME_*.md archive/old-docs/ 2>/dev/null || true
```

#### Nettoyer l'Historique Git (Optionnel)
Si le dossier `.git` est trop volumineux, vous pouvez nettoyer l'historique:

```bash
# ATTENTION: Cela réécrit l'historique Git
# Faire une sauvegarde avant!

# Nettoyer les fichiers supprimés de l'historique
git reflog expire --expire=now --all
git gc --prune=now --aggressive
```

## 🔄 Maintenance Régulière

### Nettoyage Hebdomadaire
Exécutez le script de nettoyage chaque semaine:
```bash
bash scripts/optimize-cursor-performance.sh
```

### Vérification des Fichiers Volumineux
```bash
# Trouver les fichiers > 10MB
find . -type f -size +10M -not -path "*/node_modules/*" -not -path "*/.git/*"
```

### Vérification de l'Espace Disque
```bash
# Voir la taille des dossiers principaux
du -sh apps/ node_modules/ .git/ .next/ 2>/dev/null
```

## 📈 Résultats Attendus

Après ces optimisations, vous devriez constater:
- ✅ Indexation Cursor plus rapide
- ✅ Moins de mémoire utilisée
- ✅ Recherche plus rapide dans le code
- ✅ Autocomplétion plus réactive
- ✅ Moins de bugs/lag dans Cursor

## 🛠️ Configuration Cursor Recommandée

Dans les paramètres Cursor, vous pouvez aussi:
1. **Réduire la taille de l'index**: Paramètres → Features → Code Index → Réduire la taille
2. **Désactiver l'indexation de certains dossiers**: Ajouter des patterns dans les paramètres
3. **Limiter les fichiers indexés**: Exclure les fichiers > 1MB

## ⚠️ Fichiers à Conserver

Ne supprimez PAS ces fichiers:
- `README.md`
- `CHANGELOG.md`
- `docs/**/*.md` (documentation essentielle)
- Fichiers de configuration (`package.json`, `tsconfig.json`, etc.)

## 🆘 En Cas de Problème

Si Cursor est toujours lent après ces optimisations:

1. **Redémarrer Cursor complètement**
2. **Vérifier l'espace disque disponible**
3. **Vérifier la RAM disponible** (Cursor nécessite au moins 4GB)
4. **Désactiver les extensions inutiles**
5. **Vérifier les processus en arrière-plan**

## 📝 Notes

- Le script de nettoyage est sûr: il ne supprime que les caches et fichiers temporaires
- Les fichiers markdown d'audit peuvent être archivés, pas supprimés
- Le nettoyage Git est optionnel et nécessite une sauvegarde











