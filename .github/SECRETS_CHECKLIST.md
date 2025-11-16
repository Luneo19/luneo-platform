# Checklist des Secrets & Variables d'Environnement

## ⚠️ IMPORTANT : Ne JAMAIS commiter de secrets dans le repository

## Variables d'environnement requises

Vérifiez que toutes ces variables existent dans votre secret manager (GitHub Secrets, Vercel, AWS Secrets Manager, etc.) :

### Shopify
- [ ] `SHOPIFY_API_KEY`
- [ ] `SHOPIFY_API_SECRET`

### Authentication & JWT
- [ ] `JWT_SECRET`
- [ ] `JWT_PUBLIC_KEY`

### AI & Services externes
- [ ] `OPENAI_API_KEY`
- [ ] `CLOUDINARY_URL`
- [ ] `AWS_ACCESS_KEY_ID`
- [ ] `AWS_SECRET_ACCESS_KEY`

### Payment
- [ ] `STRIPE_SECRET_KEY`
- [ ] `STRIPE_PUBLISHABLE_KEY` (optionnel, peut être public)

### Monitoring & Observability
- [ ] `SENTRY_DSN`

### Database
- [ ] `DATABASE_URL`
- [ ] `DIRECT_URL` (pour Prisma migrations)

### Supabase (si utilisé)
- [ ] `NEXT_PUBLIC_SUPABASE_URL`
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- [ ] `SUPABASE_SERVICE_ROLE_KEY`

### Redis (si utilisé)
- [ ] `REDIS_URL`
- [ ] `UPSTASH_REDIS_REST_URL`
- [ ] `UPSTASH_REDIS_REST_TOKEN`

### Email (si utilisé)
- [ ] `SMTP_HOST`
- [ ] `SMTP_PORT`
- [ ] `SMTP_USER`
- [ ] `SMTP_PASSWORD`
- [ ] `SENDGRID_API_KEY` (si SendGrid)

### OAuth (si utilisé)
- [ ] `GOOGLE_CLIENT_ID`
- [ ] `GOOGLE_CLIENT_SECRET`
- [ ] `GITHUB_CLIENT_ID`
- [ ] `GITHUB_CLIENT_SECRET`

## Vérification avant commit

Avant chaque commit, vérifiez :

1. ✅ Aucun fichier `.env` n'est dans le staging area
2. ✅ Aucune clé API hardcodée dans le code
3. ✅ Aucun token dans les fichiers de configuration
4. ✅ Les fichiers `.env.example` sont à jour (sans valeurs réelles)
5. ✅ Les secrets sont bien dans le secret manager, pas dans le code

## Commandes de vérification

```bash
# Vérifier qu'aucun .env n'est tracké
git ls-files | grep -E '\.env$|\.env\.[^e]'

# Chercher des patterns de secrets dans le code
grep -r "sk_live\|sk_test\|api_key\|secret.*=" --include="*.ts" --include="*.tsx" --include="*.js" --exclude-dir=node_modules

# Vérifier le .gitignore
git check-ignore -v .env .env.local
```

## En cas de fuite de secret

Si un secret a été commité par erreur :

1. **IMMÉDIATEMENT** : Révoquer le secret compromis
2. Référencer le commit dans le secret manager
3. Utiliser `git filter-branch` ou BFG Repo-Cleaner pour nettoyer l'historique
4. Forcer un push (après coordination avec l'équipe)
5. Notifier l'équipe de sécurité

## Ressources

- [GitHub Secrets](https://docs.github.com/en/actions/security-guides/encrypted-secrets)
- [Vercel Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)
- [AWS Secrets Manager](https://aws.amazon.com/secrets-manager/)

