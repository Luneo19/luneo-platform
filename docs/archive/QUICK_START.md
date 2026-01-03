# ⚡ Quick Start - Luneo Platform

**Guide rapide pour démarrer avec Luneo Platform**

---

## 🚀 Installation Rapide

```bash
# 1. Cloner le repository
git clone https://github.com/votre-org/luneo-platform.git
cd luneo-platform

# 2. Installer les dépendances
pnpm install

# 3. Configurer l'environnement
cd apps/frontend
cp .env.example .env.local
# Éditer .env.local avec vos valeurs

# 4. Générer Prisma Client
pnpm prisma generate

# 5. Lancer les migrations
pnpm prisma migrate dev

# 6. Lancer le serveur
pnpm dev
```

**Voir:** [SETUP.md](SETUP.md) pour guide complet

---

## 📚 Documentation Essentielle

### Pour Développeurs
1. **[SETUP.md](SETUP.md)** - Installation complète
2. **[ARCHITECTURE.md](ARCHITECTURE.md)** - Architecture du projet
3. **[docs/DEVELOPMENT_GUIDE.md](docs/DEVELOPMENT_GUIDE.md)** - Guide de développement
4. **[docs/API_DOCUMENTATION.md](docs/API_DOCUMENTATION.md)** - Documentation API

### Pour Contributeurs
1. **[CONTRIBUTING.md](CONTRIBUTING.md)** - Guide de contribution
2. **[apps/frontend/tests/TESTING_GUIDE.md](apps/frontend/tests/TESTING_GUIDE.md)** - Guide de tests
3. **[docs/TROUBLESHOOTING.md](docs/TROUBLESHOOTING.md)** - Troubleshooting

### Pour DevOps
1. **[.github/workflows/CI_CD_GUIDE.md](.github/workflows/CI_CD_GUIDE.md)** - Guide CI/CD
2. **[MONITORING_GUIDE.md](MONITORING_GUIDE.md)** - Guide monitoring
3. **[docs/SECURITY_GUIDE.md](docs/SECURITY_GUIDE.md)** - Guide sécurité

---

## 🎯 Commandes Essentielles

### Développement
```bash
# Lancer le serveur
pnpm dev

# Build
pnpm build

# Tests
pnpm test
pnpm test:coverage
pnpm test:e2e
```

### Qualité
```bash
# Lint
pnpm lint

# Type check
pnpm type-check

# Format
pnpm format
```

### Database
```bash
# Générer Prisma Client
pnpm prisma generate

# Migrations
pnpm prisma migrate dev

# Prisma Studio
pnpm prisma studio
```

---

## 🔗 Liens Rapides

- **Documentation complète:** [DOCUMENTATION_INDEX.md](DOCUMENTATION_INDEX.md)
- **Professionnalisation:** [PROFESSIONNALISATION_COMPLETE.md](PROFESSIONNALISATION_COMPLETE.md)
- **Maintenance:** [docs/MAINTENANCE_GUIDE.md](docs/MAINTENANCE_GUIDE.md)

---

## 📞 Support

- 📧 Email: support@luneo.app
- 📖 Documentation: `/docs`
- 🔗 Index: [DOCUMENTATION_INDEX.md](DOCUMENTATION_INDEX.md)

---

**Dernière mise à jour:** Décembre 2024



