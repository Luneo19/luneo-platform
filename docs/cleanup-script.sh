#!/bin/bash

# 🧹 SCRIPT DE NETTOYAGE AUTOMATIQUE - LUNEO ENTERPRISE
# =====================================================

set -e

# Colors pour l'affichage
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

# Fonctions de logging
log() {
    echo -e "${BLUE}[$(date +'%H:%M:%S')] $1${NC}"
}

success() {
    echo -e "${GREEN}✅ $1${NC}"
}

warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

error() {
    echo -e "${RED}❌ $1${NC}"
}

step() {
    echo -e "${CYAN}🔧 $1${NC}"
}

echo -e "${CYAN}🧹 NETTOYAGE AUTOMATIQUE LUNEO ENTERPRISE${NC}"
echo -e "${CYAN}==========================================${NC}"
echo ""

# Vérifier qu'on est dans le bon répertoire
if [ ! -f "frontend/package.json" ] || [ ! -f "backend/package.json" ]; then
    error "Ce script doit être exécuté depuis la racine du projet saas-backend"
    exit 1
fi

# Créer sauvegarde
log "Création de la sauvegarde..."
BACKUP_DIR="$HOME/luneo-backup-$(date +%Y%m%d-%H%M%S)"
mkdir -p "$BACKUP_DIR"
cp -r . "$BACKUP_DIR/"
success "Sauvegarde créée dans: $BACKUP_DIR"

# Phase 1: Supprimer dossiers obsolètes
step "PHASE 1: Suppression des dossiers obsolètes"

# Applications obsolètes
if [ -d "luneo-b2b-dashboard" ]; then
    log "Suppression de luneo-b2b-dashboard/"
    rm -rf luneo-b2b-dashboard/
    success "luneo-b2b-dashboard/ supprimé"
fi

if [ -d "apps" ]; then
    log "Suppression de apps/"
    rm -rf apps/
    success "apps/ supprimé"
fi

if [ -d "packages" ]; then
    log "Suppression de packages/"
    rm -rf packages/
    success "packages/ supprimé"
fi

# Configurations obsolètes
if [ -d "configs" ]; then
    log "Suppression de configs/"
    rm -rf configs/
    success "configs/ supprimé"
fi

if [ -d "scripts" ]; then
    log "Suppression de scripts/"
    rm -rf scripts/
    success "scripts/ supprimé"
fi

if [ -d "_rules" ]; then
    log "Suppression de _rules/"
    rm -rf _rules/
    success "_rules/ supprimé"
fi

if [ -d "_audit" ]; then
    log "Suppression de _audit/"
    rm -rf _audit/
    success "_audit/ supprimé"
fi

if [ -d "_cursor_archive" ]; then
    log "Suppression de _cursor_archive/"
    rm -rf _cursor_archive/
    success "_cursor_archive/ supprimé"
fi

if [ -d "07_handoff" ]; then
    log "Suppression de 07_handoff/"
    rm -rf 07_handoff/
    success "07_handoff/ supprimé"
fi

# Phase 2: Supprimer scripts obsolètes
step "PHASE 2: Suppression des scripts obsolètes"

# Scripts de consolidation
for script in consolidate-*.sh adapt-*.sh audit-*.js audit-*.sh; do
    if [ -f "$script" ]; then
        log "Suppression de $script"
        rm -f "$script"
        success "$script supprimé"
    fi
done

# Phase 3: Supprimer documentation obsolète
step "PHASE 3: Suppression de la documentation obsolète"

# Documentation obsolète
for doc in README_UNIFIED_ARCHITECTURE.md PRODUCTION_DEPLOYMENT_COMPLETE.md FRONTEND_SETUP_COMPLETE.md DEPLOYMENT_OPTIONS.md; do
    if [ -f "$doc" ]; then
        log "Suppression de $doc"
        rm -f "$doc"
        success "$doc supprimé"
    fi
done

# Phase 4: Nettoyer fichiers de configuration
step "PHASE 4: Nettoyage des fichiers de configuration"

# Fichiers de configuration racine obsolètes
for config in package.json package-lock.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.json .eslintrc.json .prettierrc; do
    if [ -f "$config" ]; then
        log "Suppression de $config"
        rm -f "$config"
        success "$config supprimé"
    fi
done

# Phase 5: Créer README principal
step "PHASE 5: Création du README principal"

cat > README.md << 'EOF'
# 🚀 Luneo Enterprise

SaaS B2B complet de personnalisation de produits avec IA.

## 📁 Structure

- `frontend/` - Next.js 15 application
- `backend/` - NestJS API
- `docs/` - Documentation complète

## 🚀 Démarrage Rapide

Voir `/docs/CURSOR_START_GUIDE.md` pour le guide de démarrage complet.

## 📚 Documentation

- [Guide de démarrage](docs/CURSOR_START_GUIDE.md)
- [Instructions Cursor](docs/INSTRUCTIONS.md)
- [Architecture](docs/ARCHITECTURE.md)
- [Roadmap](docs/ROADMAP.md)
- [TODO Cursor](docs/TODO_CURSOR.md)

## 🌐 URLs Production

- **Frontend** : https://app.luneo.app
- **Backend API** : https://api.luneo.app
- **Documentation** : https://docs.luneo.app

## 🛠️ Développement

### Frontend
```bash
cd frontend
npm install
npm run dev
```

### Backend
```bash
cd backend
npm install
npm run dev
```

## 📊 État Actuel

- ✅ **Frontend** : 15+ pages fonctionnelles
- ✅ **Backend** : 10 modules complets
- ✅ **Base de données** : 15+ modèles Prisma
- ✅ **Services externes** : Stripe, OpenAI, Cloudinary
- ✅ **Déploiement** : Vercel + Hetzner

**Luneo Enterprise est en production et prêt pour l'expansion ! 🚀**
EOF

success "README principal créé"

# Phase 6: Vérification finale
step "PHASE 6: Vérification finale"

log "Structure finale du projet:"
echo ""
echo "📁 Structure actuelle:"
tree -L 2 -a -I 'node_modules|.git|.next|dist|build' 2>/dev/null || find . -maxdepth 2 -type d | head -20

echo ""
log "📊 Statistiques:"
echo "- Dossiers supprimés: $(find . -maxdepth 1 -type d | wc -l) dossiers restants"
echo "- Fichiers supprimés: $(find . -maxdepth 1 -type f | wc -l) fichiers à la racine"
echo "- Sauvegarde créée: $BACKUP_DIR"

echo ""
success "🎉 Nettoyage terminé avec succès!"
echo ""
warning "📋 Prochaines étapes recommandées:"
echo "1. Vérifier que frontend/ et backend/ fonctionnent"
echo "2. Lire docs/CURSOR_START_GUIDE.md"
echo "3. Commencer par les tâches d'optimisation"
echo "4. Développer les modules manquants selon le plan"

echo ""
log "🚀 Luneo Enterprise est maintenant optimisé et prêt pour le développement !"

